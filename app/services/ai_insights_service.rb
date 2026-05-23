# Facade in front of the configured `AiProviders.current`. Handles three
# cross-cutting concerns the providers don't (and shouldn't) know about:
#
#   1. **Caching** — identical inputs return the cached payload for 6h. Cache
#      hits never count against the user's rate limit.
#   2. **Rate limiting** — non-admin users are capped per day by `AiRateLimiter`.
#      When the limit is hit, we return a `{ rateLimited: true, ... }` payload
#      that the frontend renders as a friendly notice.
#   3. **Cost logging** — every actual LLM hit creates an `AiRequest` row
#      (user / feature / provider) for the limiter and future cost analytics.
class AiInsightsService
  RATE_LIMITED = :rate_limited

  class << self
    def radar_insights(stocks_data, user:, locale: nil, preferred_currency: nil)
      return empty_radar_insights if stocks_data.blank?

      lang = normalize_locale(locale)
      ccy = preferred_currency || "USD"
      cache_key = "ai/radar/#{Digest::MD5.hexdigest(stocks_data.to_json)}/#{lang}/#{ccy}"

      with_cache_and_limit(cache_key: cache_key, user: user, feature: "radar_insights") do
        provider.radar_insights(stocks_data, locale: lang, preferred_currency: ccy)
      end
    end

    def portfolio_insights(stocks_data, user:, locale: nil, preferred_currency: nil)
      return empty_portfolio_insights if stocks_data.blank?

      lang = normalize_locale(locale)
      ccy = preferred_currency || "USD"
      cache_key = "ai/portfolio/#{Digest::MD5.hexdigest(stocks_data.to_json)}/#{lang}/#{ccy}"

      with_cache_and_limit(cache_key: cache_key, user: user, feature: "portfolio_insights") do
        provider.portfolio_insights(stocks_data, locale: lang, preferred_currency: ccy)
      end
    end

    def stock_summary(stock_data, user:, locale: nil, preferred_currency: nil)
      return empty_stock_summary if stock_data.blank?

      lang = normalize_locale(locale)
      ccy = preferred_currency || "USD"
      cache_key = "ai/stock/#{stock_data[:id]}/#{stock_data[:updated_at]}/#{lang}/#{ccy}"

      with_cache_and_limit(cache_key: cache_key, user: user, feature: "stock_summary") do
        provider.stock_summary(stock_data, locale: lang, preferred_currency: ccy)
      end
    end

    # `user:` is the operator who triggered the draft (always an admin via
    # `Admin::ContentDraftsController`). Pass through so the limiter sees an
    # admin and bypasses; the record still gets logged for cost attribution.
    def social_post(topic, user:, locale: nil)
      lang = normalize_locale(locale)
      # No cache: each click should produce a fresh draft.
      with_limit_only(user: user, feature: "social_post") do
        provider.social_post(topic, locale: lang)
      end
    end

    private

    def provider
      AiProviders.current
    end

    SUPPORTED_LOCALES = %w[en es].freeze

    def normalize_locale(locale)
      lang = locale.to_s.split("-").first&.downcase
      SUPPORTED_LOCALES.include?(lang) ? lang : "en"
    end

    # Cache probe → limit check → LLM call → log → cache write. Crucially the
    # cache probe runs *before* the limit check, so a rate-limited user can
    # still get cached data — only fresh LLM hits are blocked.
    def with_cache_and_limit(cache_key:, user:, feature:)
      if (cached = Rails.cache.read(cache_key))
        return cached
      end

      gate = AiRateLimiter.allow?(user, feature)
      return rate_limited_payload(feature, gate) unless gate.allowed?

      data = yield
      AiRateLimiter.record!(user: user, feature: feature, provider: provider.name)
      Rails.cache.write(cache_key, data, expires_in: 6.hours)
      data
    end

    def with_limit_only(user:, feature:)
      gate = AiRateLimiter.allow?(user, feature)
      return rate_limited_payload(feature, gate) unless gate.allowed?

      data = yield
      AiRateLimiter.record!(user: user, feature: feature, provider: provider.name)
      data
    end

    def rate_limited_payload(feature, gate)
      {
        rateLimited: true,
        feature: feature,
        limit: gate.limit,
        remaining: gate.remaining,
        resetAt: gate.reset_at&.iso8601
      }
    end

    def empty_radar_insights
      {
        summary: "Add stocks to your radar to get AI-powered portfolio insights.",
        buyingOpportunities: [],
        coverageGaps: "No stocks to analyze.",
        riskFlags: [],
        strengths: []
      }
    end

    def empty_portfolio_insights
      {
        summary: "Add stocks to your portfolio to get AI-powered insights.",
        buyingOpportunities: [],
        coverageGaps: "No stocks to analyze.",
        riskFlags: [],
        strengths: []
      }
    end

    def empty_stock_summary
      {
        summary: "No data available for analysis.",
        verdict: "hold",
        keyPoints: []
      }
    end
  end
end
