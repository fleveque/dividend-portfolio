require 'rails_helper'

RSpec.describe ContentGenerator do
  let(:payload) do
    {
      headline: "AAPL is paying its dividend",
      x: { text: "AAPL just paid 0.6%. Boring? Sure. Reliable? Also yes." },
      linkedin: { text: "A clean LinkedIn-style post about AAPL with one paragraph and a closer." },
      hashtags: %w[dividends]
    }
  end

  before do
    allow(AiInsightsService).to receive(:social_post).and_return(payload)
  end

  describe '.call' do
    it 'returns the parsed payload from the AI provider' do
      result = described_class.call(
        category: "stock_of_the_day",
        topic_key: "AAPL",
        inputs: { symbol: "AAPL", dividend_yield: 0.6 }
      )
      expect(result[:headline]).to eq("AAPL is paying its dividend")
    end

    it 'raises GenerationFailed if the provider returns an empty payload' do
      allow(AiInsightsService).to receive(:social_post).and_return(nil)

      expect {
        described_class.call(category: "stock_of_the_day", topic_key: "AAPL", inputs: {})
      }.to raise_error(described_class::GenerationFailed)
    end

    it 'truncates an over-long X text and flags it' do
      long = "A" * 300
      allow(AiInsightsService).to receive(:social_post).and_return(payload.merge(x: { text: long }))

      result = described_class.call(category: "stock_of_the_day", topic_key: "AAPL", inputs: {})

      expect(result[:x][:text].length).to eq(described_class::X_MAX_LENGTH)
      expect(result[:truncated_x]).to be true
    end

    describe 'privacy assertion' do
      it 'raises if the input contains a portfolio_slug reference' do
        expect {
          described_class.call(category: "pulse_aggregates", topic_key: "X", inputs: { leaked: "portfolio_slug=foo" })
        }.to raise_error(described_class::PrivacyViolation, /portfolio_slug/)
      end

      it 'raises if the input contains an email address' do
        expect {
          described_class.call(category: "x", topic_key: "y", inputs: { from: "alice@example.com" })
        }.to raise_error(described_class::PrivacyViolation, /forbidden/)
      end

      it 'raises if the AI-returned payload contains an email' do
        allow(AiInsightsService).to receive(:social_post).and_return(
          payload.merge(x: { text: "Email alice@example.com for more!" })
        )
        expect {
          described_class.call(category: "stock_of_the_day", topic_key: "AAPL", inputs: {})
        }.to raise_error(described_class::PrivacyViolation)
      end

      it 'raises if the AI-returned payload contains a pulse portfolio URL' do
        allow(AiInsightsService).to receive(:social_post).and_return(
          payload.merge(linkedin: { text: "Check out pulse.quantic.es/p/alice" })
        )
        expect {
          described_class.call(category: "stock_of_the_day", topic_key: "AAPL", inputs: {})
        }.to raise_error(described_class::PrivacyViolation)
      end
    end
  end
end
