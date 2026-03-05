class NatsPublisher
  def self.publish(subject, payload)
    full_subject = "#{Rails.env}.#{subject}"
    json = payload.to_json

    nats = NATS.connect(Rails.application.config.nats_url)
    nats.publish(full_subject, json)
    nats.flush
    nats.close

    Rails.logger.info("[NATS] Published #{full_subject}")
  rescue => e
    Rails.logger.warn("[NATS] Failed to publish #{full_subject}: #{e.message}")
  end
end
