module FinancialDataProviders
  # FX-pair lookup via Alpha Vantage's CURRENCY_EXCHANGE_RATE endpoint. Mirrors
  # the contract `FxRateService` expects from the Yahoo-backed default:
  # `get_fx_rate(from, to)` returns a `Float` (one unit of `from` in `to`) or
  # `nil` on any failure.
  #
  # Wired in via `Rails.application.config.fx_rate_provider` when the active
  # stock provider is `:alpha_vantage`, so callers don't change.
  #
  # Caveat: AV's free tier is 25 requests/day shared across ALL endpoints —
  # both stock refreshes and FX lookups draw from the same bucket. If you're
  # on AV's free tier, expect FX pairs to be rate-limited; FxRateService's
  # DB-backed cache (`STALE_AFTER = 24.hours`) absorbs that under normal use.
  class AlphaVantageFxProvider
    BASE_URL = "https://www.alphavantage.co/query"

    class << self
      def get_fx_rate(from, to)
        return 1.0 if from == to

        api_key = ENV["ALPHAVANTAGE_API_KEY"]
        return nil if api_key.blank?

        response = HTTParty.get(BASE_URL, query: {
          function: "CURRENCY_EXCHANGE_RATE", from_currency: from, to_currency: to, apikey: api_key
        }, timeout: 15)

        rate = response.parsed_response.dig("Realtime Currency Exchange Rate", "5. Exchange Rate")
        rate&.to_f
      rescue StandardError => e
        Rails.logger.warn "AlphaVantage FX error #{from}->#{to}: #{e.message}"
        nil
      end
    end
  end
end
