Rails.application.config.nats_url = ENV.fetch("NATS_URL", "nats://localhost:4222")
Rails.application.config.nats_env_prefix = ENV.fetch("NATS_ENV_PREFIX", "dev")
