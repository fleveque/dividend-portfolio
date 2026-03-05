RSpec.describe NatsPublisher do
  describe '.publish' do
    let(:nats_double) { instance_double("NATS::IO::Client", publish: nil, flush: nil, close: nil) }

    before do
      # Override the global stub so the real method executes
      allow(NatsPublisher).to receive(:publish).and_call_original
      allow(NATS).to receive(:connect).and_return(nats_double)
    end

    it 'publishes to the correct subject with env prefix' do
      NatsPublisher.publish("portfolio.updated", { slug: "test" })

      expect(NATS).to have_received(:connect)
      expect(nats_double).to have_received(:publish).with("test.portfolio.updated", '{"slug":"test"}')
      expect(nats_double).to have_received(:flush)
      expect(nats_double).to have_received(:close)
    end

    it 'logs and rescues connection errors' do
      allow(NATS).to receive(:connect).and_raise(Errno::ECONNREFUSED)

      expect(Rails.logger).to receive(:warn).with(/Failed to publish/)

      NatsPublisher.publish("portfolio.updated", { slug: "test" })
    end
  end
end
