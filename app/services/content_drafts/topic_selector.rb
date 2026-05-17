module ContentDrafts
  # Picks a (category, topic_key) pair for the next draft.
  #
  # Auto-pick path: drops categories on cooldown / unavailable, weighted-random
  # picks from what's left. Explicit-pick path: validates the category is
  # available today and raises TopicUnavailable with a human-readable reason
  # otherwise (controller turns that into a 422).
  module TopicSelector
    class TopicUnavailable < StandardError; end

    CATEGORY_COOLDOWN_DAYS = 1
    STOCK_REPEAT_DAYS = 14
    DIVIDEND_CALENDAR_REPEAT_DAYS = 21 # roughly 3 weeks — covers up to ~3 ISO-week buckets
    PULSE_AGGREGATE_REPEAT_DAYS = 60   # one per month

    AUTO_CATEGORIES = %w[stock_of_the_day dividend_calendar pulse_aggregates].freeze
    AUTO_WEIGHTS = {
      "stock_of_the_day"  => 0.5,
      "dividend_calendar" => 0.3,
      "pulse_aggregates"  => 0.2
    }.freeze

    module_function

    def pick(category: nil, extras: {})
      if category.present?
        pick_explicit(category.to_s, extras)
      else
        pick_auto
      end
    end

    def pick_auto
      cooldown_set = ContentDraft.recent_topic_types(days: CATEGORY_COOLDOWN_DAYS).to_set
      eligible = AUTO_CATEGORIES.reject { |c| cooldown_set.include?(c) }
      eligible = AUTO_CATEGORIES if eligible.empty? # everyone on cooldown → fall through

      eligible.each do |c|
        topic_key = topic_key_for(c)
        return { category: c, topic_key: topic_key } if topic_key
      end

      # All categories had no available topic_key (very unlikely — stock_of_the_day
      # has a large pool). As a last resort, force a stock_of_the_day with a
      # relaxed (zero) cooldown so we always emit something.
      symbol = pick_stock_symbol(exclude: [].to_set)
      raise TopicUnavailable, "no topic available for any category today" if symbol.nil?

      { category: "stock_of_the_day", topic_key: symbol }
    end

    def pick_explicit(category, extras)
      unless ContentDraft::TOPIC_TYPES.include?(category)
        raise TopicUnavailable, "unknown category: #{category}"
      end

      if category == "feature_announcement"
        return pick_feature_announcement(extras)
      end

      key = topic_key_for(category)
      raise TopicUnavailable, "no available topic for #{category} today" if key.nil?

      { category: category, topic_key: key }
    end

    def pick_feature_announcement(extras)
      name = extras[:feature_name].to_s.strip
      raise TopicUnavailable, "feature_announcement requires feature_name" if name.empty?

      slug = name.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
      raise TopicUnavailable, "feature_name produced empty slug" if slug.empty?

      used = ContentDraft.recent_keys("feature_announcement", days: 365 * 5).to_set # de-dupe forever
      raise TopicUnavailable, "feature '#{slug}' already announced" if used.include?(slug)

      { category: "feature_announcement", topic_key: slug }
    end

    # Selected by category — uses an internal helper per category. Returns nil
    # when nothing's eligible today, which lets auto-pick try the next category.
    def topic_key_for(category)
      case category
      when "stock_of_the_day"
        exclude = ContentDraft.recent_keys("stock_of_the_day", days: STOCK_REPEAT_DAYS)
        pick_stock_symbol(exclude: exclude)
      when "dividend_calendar"
        return nil unless TopicDataBuilder.any_upcoming_ex_dividend?

        week_key = Date.current.strftime("%G-W%V")
        used = ContentDraft.recent_keys("dividend_calendar", days: DIVIDEND_CALENDAR_REPEAT_DAYS)
        used.include?(week_key) ? nil : week_key
      when "pulse_aggregates"
        return nil unless TopicDataBuilder.pulse_cohort_meets_threshold?

        month_key = Date.current.strftime("%Y-%m")
        used = ContentDraft.recent_keys("pulse_aggregates", days: PULSE_AGGREGATE_REPEAT_DAYS)
        used.include?(month_key) ? nil : month_key
      end
    end

    # Walks Stock.top_scored in shuffled order; returns the first symbol not in
    # `exclude`. Returns nil if every candidate is excluded.
    def pick_stock_symbol(exclude:)
      Stock.top_scored(50).each do |stock|
        return stock.symbol unless exclude.include?(stock.symbol)
      end
      nil
    end
  end
end
