module AiProviders
  # Factory that returns the configured AI provider instance, memoised per
  # process. Selection follows `Rails.application.config.ai_provider`
  # (set by `config/initializers/ai_provider.rb`, overridable via
  # `ENV["AI_PROVIDER"]`).
  #
  # All AI-using code paths in the app should go through this — never
  # instantiate a specific provider class directly. Swapping Gemini for
  # Anthropic/OpenAI should be a 1-day task (add a provider that conforms
  # to `AiProviders::BaseProvider`, flip the env var), not a refactor.
  def self.current
    @current ||= begin
      name = Rails.application.config.ai_provider
      "AiProviders::#{name.to_s.classify}Provider".constantize.new
    rescue NameError => e
      raise "Unknown AI provider: #{name.inspect}. " \
            "Add a class under AiProviders:: that inherits from BaseProvider. " \
            "(#{e.message})"
    end
  end

  # Test/spec hook — reset the memoised instance.
  def self.reset!
    @current = nil
  end
end
