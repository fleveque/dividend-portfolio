class ContentGenerator
  class PrivacyViolation < StandardError; end
  class GenerationFailed < StandardError; end

  X_MAX_LENGTH = 280
  LINKEDIN_MAX_LENGTH = 3000

  # Forbidden patterns we never want in a draft payload — defence-in-depth on
  # top of the topic-builder's anonymisation. Matches an @-mention pattern,
  # raw emails, and likely-portfolio-slug URLs.
  FORBIDDEN_PATTERNS = [
    /\bportfolio_slug\b/i,
    /[a-z0-9.+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    %r{\b(?:https?://)?pulse\.quantic\.es/p/[a-z0-9-]+}i
  ].freeze

  class << self
    # Topic shape: { category:, topic_key:, inputs: {...} }. Returns the parsed
    # payload from the AI provider — controller persists it as a ContentDraft.
    def call(category:, topic_key:, inputs:, locale: nil)
      topic = { category: category.to_s, topic_key: topic_key, inputs: inputs }

      assert_privacy!(inputs)

      payload = AiInsightsService.social_post(topic, locale: locale)
      raise GenerationFailed, "empty payload from provider" if payload.blank?

      enforce_length_guards!(payload)
      assert_privacy!(payload)
      payload
    end

    private

    def assert_privacy!(blob)
      text = blob.to_json
      FORBIDDEN_PATTERNS.each do |pattern|
        next unless text.match?(pattern)

        raise PrivacyViolation, "payload contains forbidden pattern: #{pattern.inspect}"
      end
    end

    # Gemini's `maxLength` is advisory; do a hard guard post-parse. If the X
    # text overruns we truncate to 277 chars + "…" so the operator still gets
    # something usable. Mark the payload as truncated for the UI badge.
    def enforce_length_guards!(payload)
      x_text = payload.dig(:x, :text) || payload.dig("x", "text") || ""
      if x_text.length > X_MAX_LENGTH
        truncated = x_text[0, X_MAX_LENGTH - 1] + "…"
        write_text(payload, :x, truncated)
        payload[:truncated_x] = true
        payload["truncated_x"] = true
      end

      li_text = payload.dig(:linkedin, :text) || payload.dig("linkedin", "text") || ""
      if li_text.length > LINKEDIN_MAX_LENGTH
        write_text(payload, :linkedin, li_text[0, LINKEDIN_MAX_LENGTH - 1] + "…")
        payload[:truncated_linkedin] = true
        payload["truncated_linkedin"] = true
      end
    end

    def write_text(payload, platform, text)
      if payload[platform].is_a?(Hash)
        payload[platform][:text] = text
        payload[platform]["text"] = text if payload[platform].key?("text")
      elsif payload[platform.to_s].is_a?(Hash)
        payload[platform.to_s]["text"] = text
        payload[platform.to_s][:text] = text if payload[platform.to_s].key?(:text)
      end
    end
  end
end
