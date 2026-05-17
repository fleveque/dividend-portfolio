module ContentDrafts
  # Owns the AR queries that turn a (category, topic_key) into the input hash
  # the LLM sees. No Gemini calls happen here. Privacy guard for the pulse
  # cohort lives in build_pulse_aggregates.
  module TopicDataBuilder
    MIN_COHORT = ENV.fetch("CONTENT_PULSE_MIN_COHORT", "5").to_i

    module_function

    def build(category, topic_key, extras: {})
      case category.to_s
      when "stock_of_the_day"   then build_stock_of_the_day(topic_key)
      when "dividend_calendar"  then build_dividend_calendar(topic_key)
      when "pulse_aggregates"   then build_pulse_aggregates(topic_key)
      when "feature_announcement" then build_feature_announcement(topic_key, extras)
      else raise ArgumentError, "unknown category: #{category}"
      end
    end

    def pulse_cohort_meets_threshold?
      pulse_cohort_count >= MIN_COHORT
    end

    def pulse_cohort_count
      User.where.not(portfolio_slug: nil).count
    end

    def any_upcoming_ex_dividend?
      Stock.where(ex_dividend_date: Date.current..7.days.from_now).exists?
    end

    # --- per-category builders ---

    def build_stock_of_the_day(symbol)
      stock = Stock.find_by(symbol: symbol)
      return nil if stock.nil? || stock.price.nil?

      decorated = StockDecorator.new(stock)
      {
        symbol: stock.symbol,
        name: stock.name,
        currency: stock.currency,
        price: stock.price.to_f,
        formatted_price: decorated.formatted_price,
        dividend_yield: stock.dividend_yield&.to_f,
        formatted_dividend_yield: decorated.formatted_dividend_yield,
        payout_ratio: stock.payout_ratio&.to_f,
        dividend_score: decorated.dividend_score,
        dividend_score_label: decorated.dividend_score_label,
        ex_dividend_date: stock.ex_dividend_date&.iso8601,
        payment_frequency: stock.payment_frequency,
        payment_months: stock.payment_months,
        fifty_two_week_range_position: decorated.fifty_two_week_range_position
      }.compact
    end

    def build_dividend_calendar(week_key)
      upcoming = Stock
        .where.not(ex_dividend_date: nil)
        .where(ex_dividend_date: Date.current..7.days.from_now)
        .order(:ex_dividend_date)
        .limit(8)
      return nil if upcoming.empty?

      items = upcoming.map do |s|
        {
          symbol: s.symbol,
          name: s.name,
          ex_dividend_date: s.ex_dividend_date.iso8601,
          dividend_yield: s.dividend_yield&.to_f,
          payment_frequency: s.payment_frequency,
          currency: s.currency
        }.compact
      end

      {
        week_key: week_key,
        count: items.size,
        currencies: items.map { |i| i[:currency] }.uniq,
        earliest_date: items.first[:ex_dividend_date],
        latest_date: items.last[:ex_dividend_date],
        stocks: items
      }
    end

    def build_pulse_aggregates(month_key)
      return nil unless pulse_cohort_meets_threshold?

      opt_in_users = User.where.not(portfolio_slug: nil)
      holdings = Holding.where(user_id: opt_in_users.select(:id)).includes(:stock)
      return nil if holdings.empty?

      symbol_counts = holdings.group_by { |h| h.stock.symbol }
                              .transform_values { |hs| hs.map(&:user_id).uniq.size }
      top_symbols = symbol_counts.sort_by { |_, count| -count }.first(3).map(&:first)

      yields = holdings.map { |h| h.stock.dividend_yield }.compact
      avg_yield = yields.any? ? (yields.sum.to_f / yields.size).round(2) : nil

      frequency_counts = holdings.map { |h| h.stock.payment_frequency }.compact.tally
      dominant_freq = frequency_counts.max_by { |_, count| count }&.first

      {
        month_key: month_key,
        opt_in_count: opt_in_users.count,
        top_held_symbols: top_symbols,
        avg_dividend_yield: avg_yield,
        dominant_payment_frequency: dominant_freq,
        holding_count: holdings.count
      }
    end

    def build_feature_announcement(slug, extras)
      name = extras[:feature_name].to_s.strip
      description = extras[:description].to_s.strip
      return nil if name.empty? || description.empty?

      {
        slug: slug,
        feature_name: name,
        description: description,
        audience: extras[:audience].to_s.strip.presence
      }.compact
    end
  end
end
