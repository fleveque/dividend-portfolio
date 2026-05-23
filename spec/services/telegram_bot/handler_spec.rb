require "rails_helper"

RSpec.describe TelegramBot::Handler, type: :service do
  let(:user) { create(:user) }
  let(:chat_id) { 99999 }
  let(:from_id) { 12345 }

  before do
    allow(TelegramBot::Client).to receive(:send_message).and_return({ "ok" => true })
    allow(TelegramBot::Client).to receive(:send_typing).and_return({ "ok" => true })
  end

  def update(text)
    {
      message: {
        text: text,
        from: { id: from_id, language_code: "en" },
        chat: { id: chat_id }
      }
    }
  end

  describe "/start without a code (cold open)" do
    it "replies with linking instructions" do
      described_class.process(update("/start"))
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(chat_id: chat_id, text: /Settings.*Connect Telegram/))
    end
  end

  describe "/start <code>" do
    it "links the user when the code is valid" do
      link = UserTelegramLink.start_linking!(user)
      described_class.process(update("/start #{link.code}"))
      expect(link.reload.linked_at).to be_present
      expect(link.reload.chat_id).to eq(chat_id.to_s)
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: /Linked/i))
    end

    it "rejects an unknown code" do
      described_class.process(update("/start bogus"))
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: /isn't valid or has expired/i))
    end
  end

  describe "unlinked chat sending arbitrary text" do
    it "tells the user to connect from Settings" do
      described_class.process(update("what dividends did I get this month?"))
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: /Connect Telegram/i))
    end
  end

  describe "linked chat" do
    before do
      UserTelegramLink.create!(user: user, chat_id: chat_id.to_s, telegram_user_id: from_id.to_s, linked_at: Time.current)
    end

    it "/help replies with the command list" do
      described_class.process(update("/help"))
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: /Things I can answer/))
    end

    it "/unlink removes the link and confirms" do
      described_class.process(update("/unlink"))
      expect(UserTelegramLink.where(chat_id: chat_id.to_s)).to be_empty
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: /no longer linked/i))
    end

    it "free-text questions go through NLU" do
      allow(TelegramBot::Nlu).to receive(:answer).and_return("here is your radar")
      described_class.process(update("show my radar"))
      expect(TelegramBot::Nlu).to have_received(:answer)
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: "here is your radar"))
    end

    it "free-text questions short-circuit when rate-limited" do
      AiRateLimiter::DAILY_LIMIT.times { AiRateLimiter.record!(user: user, feature: "telegram_chat", provider: :gemini) }
      allow(TelegramBot::Nlu).to receive(:answer)
      described_class.process(update("show my radar"))
      expect(TelegramBot::Nlu).not_to have_received(:answer)
      expect(TelegramBot::Client).to have_received(:send_message)
        .with(hash_including(text: /AI requests today/i))
    end
  end
end
