RSpec.describe NatsPublisher do
  describe '.publish' do
    let(:nats_double) { instance_double("NATS::IO::Client", publish: nil, flush: nil, close: nil) }

    before do
      # Override the global stub so the real method executes
      allow(NatsPublisher).to receive(:publish).and_call_original
      NatsPublisher.reset_connection
      allow(NATS).to receive(:connect).and_return(nats_double)
    end

    after { NatsPublisher.reset_connection }

    it 'publishes to the correct subject with env prefix' do
      NatsPublisher.publish("portfolio.updated", { slug: "test" })

      expect(NATS).to have_received(:connect).once
      expect(nats_double).to have_received(:publish).with("dev.portfolio.updated", '{"slug":"test"}')
      expect(nats_double).to have_received(:flush)
    end

    it 'reuses the connection across calls' do
      NatsPublisher.publish("portfolio.updated", { slug: "a" })
      NatsPublisher.publish("portfolio.opted_in", { slug: "b" })

      expect(NATS).to have_received(:connect).once
    end

    it 'resets and logs on connection error' do
      allow(NATS).to receive(:connect).and_raise(Errno::ECONNREFUSED)

      expect(Rails.logger).to receive(:warn).with(/Failed to publish/)

      NatsPublisher.publish("portfolio.updated", { slug: "test" })
    end
  end
end
