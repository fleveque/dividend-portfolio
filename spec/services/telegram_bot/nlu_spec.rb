require "rails_helper"

RSpec.describe TelegramBot::Nlu, type: :service do
  let(:user) { create(:user) }

  before do
    allow(AiProviders).to receive(:current).and_return(
      instance_double(
        AiProviders::GeminiProvider,
        name: :gemini,
        chat: AiProviders::ChatResult.new(text: "Your radar has 6 stocks.", tool_calls: [])
      )
    )
  end

  it "returns the LLM's final text and records an AiRequest" do
    expect {
      reply = described_class.answer(question: "show my radar", user: user, locale: "en")
      expect(reply).to eq("Your radar has 6 stocks.")
    }.to change { AiRequest.where(user: user, feature: "telegram_chat").count }.by(1)
  end

  it "falls back to a friendly error string when the provider raises" do
    allow(AiProviders.current).to receive(:chat).and_raise(AiProviders::BaseProvider::AiError, "boom")
    reply = described_class.answer(question: "show my radar", user: user, locale: "en")
    expect(reply).to match(/wrong on our side/i)
  end
end
