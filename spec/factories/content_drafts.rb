FactoryBot.define do
  factory :content_draft do
    topic_type { "stock_of_the_day" }
    sequence(:topic_key) { |n| "AAPL-#{n}" }
    generated_at { Time.current }
    payload do
      {
        headline: "Apple's dividend just landed",
        x: { text: "AAPL paid $0.25 today — that's a 0.6% trailing yield. Boring? Sure. Reliable? Also yes." },
        linkedin: { text: "A short, professional LinkedIn-style post about AAPL with two paragraphs." },
        hashtags: %w[dividends AAPL]
      }
    end
    inputs do
      { symbol: "AAPL", dividend_yield: 0.6, dividend_score: 7 }
    end

    trait :dividend_calendar do
      topic_type { "dividend_calendar" }
      sequence(:topic_key) { |n| "2026-W#{20 + n}" }
    end

    trait :pulse_aggregates do
      topic_type { "pulse_aggregates" }
      sequence(:topic_key) { |n| "2026-0#{n}" }
    end

    trait :feature_announcement do
      topic_type { "feature_announcement" }
      sequence(:topic_key) { |n| "feature-#{n}" }
    end

    trait :copied do
      copied_at { Time.current }
    end
  end
end
