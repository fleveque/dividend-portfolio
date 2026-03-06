class NatsPublisher
  def self.publish(subject, payload)
    full_subject = "#{Rails.application.config.nats_env_prefix}.#{subject}"
    json = payload.to_json

    connection.publish(full_subject, json)
    connection.flush

    Rails.logger.info("[NATS] Published #{full_subject}")
  rescue => e
    reset_connection
    Rails.logger.warn("[NATS] Failed to publish #{full_subject}: #{e.message}")
  end

  def self.connection
    @connection ||= NATS.connect(Rails.application.config.nats_url)
  end

  def self.reset_connection
    @connection&.close
  rescue # rubocop:disable Lint/SuppressedException
  ensure
    @connection = nil
  end
end
