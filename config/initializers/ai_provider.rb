Rails.application.config.after_initialize do
  if ENV["GEMINI_API_KEY"].blank?
    Rails.logger.warn "GEMINI_API_KEY is not set. AI insights features will be unavailable."
  end
end
