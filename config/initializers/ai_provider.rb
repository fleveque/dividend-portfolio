# Default AI provider. Swap via `AI_PROVIDER` env var (e.g. `:anthropic`,
# `:openai`) once a corresponding `AiProviders::*Provider` class exists.
# Gemini is the only implementation today.
Rails.application.config.ai_provider = ENV.fetch("AI_PROVIDER", "gemini").to_sym

Rails.application.config.after_initialize do
  if Rails.application.config.ai_provider == :gemini && ENV["GEMINI_API_KEY"].blank?
    Rails.logger.warn "GEMINI_API_KEY is not set. AI insights features will be unavailable."
  end
end
