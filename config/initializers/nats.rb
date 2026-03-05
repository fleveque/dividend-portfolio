Rails.application.config.nats_url = ENV.fetch("NATS_URL", "nats://localhost:4222")
