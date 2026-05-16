class FxRateService
  STALE_AFTER = 24.hours
  CACHE_TTL = 1.hour

  class << self
    def convert(amount, from:, to:)
      return amount if from == to

      r = rate(from: from, to: to)
      r && amount * r
    end

    def rate(from:, to:)
      return 1.0 if from == to

      cached_rate(from, to) || db_rate(from, to) || inverse_rate(from, to) || provider_rate(from, to)
    end

    def refresh_all(pairs)
      pairs.each_with_object({}) do |(from, to), results|
        results["#{from}#{to}"] = provider_rate(from, to)
      end
    end

    # Cartesian product of (currencies held by any user × users' preferred currencies),
    # minus identity pairs. Used by the nightly job to know what to refresh.
    def pairs_needed
      holding_currencies = Stock.joins(:holdings).distinct.pluck(:currency)
      preferred = User.distinct.pluck(:preferred_currency)
      codes = (holding_currencies + preferred).compact.uniq

      codes.product(codes).reject { |from, to| from == to }
    end

    private

    def cached_rate(from, to)
      Rails.cache.read(cache_key(from, to))
    end

    def db_rate(from, to)
      raw = db_raw_rate(from, to)
      cache_and_return(from, to, raw) if raw
    end

    # Halves traffic for the common any↔USD case: if USDEUR is fresh, EURUSD is just 1/x.
    def inverse_rate(from, to)
      inverse = cached_rate(to, from) || db_raw_rate(to, from)
      return nil unless inverse&.positive?

      cache_and_return(from, to, 1.0 / inverse)
    end

    def provider_rate(from, to)
      rate = provider.get_fx_rate(from, to)
      return nil unless rate&.positive?

      FxRate.upsert_rate(from, to, rate)
      cache_and_return(from, to, rate.to_f)
    end

    def db_raw_rate(from, to)
      FxRate.fresh.find_by(base: from, quote: to)&.rate&.to_f
    end

    def cache_and_return(from, to, rate)
      Rails.cache.write(cache_key(from, to), rate, expires_in: CACHE_TTL)
      rate
    end

    def cache_key(from, to)
      "fx/#{from}#{to}"
    end

    def provider
      Rails.application.config.respond_to?(:fx_rate_provider) && Rails.application.config.fx_rate_provider ||
        YahooFinanceClient::Stock
    end
  end
end
