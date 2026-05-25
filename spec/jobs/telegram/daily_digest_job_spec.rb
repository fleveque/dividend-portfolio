require "rails_helper"

RSpec.describe Telegram::DailyDigestJob, type: :job do
  let(:user) { create(:user) }

  before do
    allow(TelegramBot::Client).to receive(:send_message).and_return({ "ok" => true })
  end

  it "skips users who haven't opted in" do
    UserTelegramLink.create!(user: user, chat_id: "1", telegram_user_id: "u", linked_at: Time.current, notifications_enabled: false)
    described_class.perform_now
    expect(TelegramBot::Client).not_to have_received(:send_message)
  end

  it "skips users with an empty digest (no ex-divs, no dividends, no target hits)" do
    UserTelegramLink.create!(user: user, chat_id: "1", telegram_user_id: "u", linked_at: Time.current, notifications_enabled: true)
    # User has no holdings, no dividends, no radar — nothing to send.
    described_class.perform_now
    expect(TelegramBot::Client).not_to have_received(:send_message)
  end

  it "sends a message for opted-in users with content" do
    stock = create(:stock, symbol: "KO", price: 60, currency: "USD",
                   dividend: 2.0, payment_frequency: "quarterly",
                   ex_dividend_date: 5.days.from_now)
    create(:holding, user: user, stock: stock, quantity: 100, average_price: 55)
    UserTelegramLink.create!(user: user, chat_id: "42", telegram_user_id: "u", linked_at: Time.current, notifications_enabled: true)

    described_class.perform_now

    expect(TelegramBot::Client).to have_received(:send_message)
      .with(hash_including(chat_id: "42", text: /KO/))
  end

  it "builds the digest in the user's stored locale" do
    es_user = create(:user, locale: "es")
    UserTelegramLink.create!(user: es_user, chat_id: "9", telegram_user_id: "u", linked_at: Time.current, notifications_enabled: true)
    allow(Telegram::DailyDigest).to receive(:build).and_return("digest")

    described_class.perform_now

    expect(Telegram::DailyDigest).to have_received(:build).with(user: es_user, locale: "es")
  end

  it "doesn't abort the batch if one user's digest raises" do
    user_a = create(:user)
    user_b = create(:user)
    [ user_a, user_b ].each_with_index do |u, i|
      UserTelegramLink.create!(user: u, chat_id: i.to_s, telegram_user_id: i.to_s, linked_at: Time.current, notifications_enabled: true)
    end

    # Force the first build to raise; the second should still send.
    call_count = 0
    allow(Telegram::DailyDigest).to receive(:build) do |**|
      call_count += 1
      raise StandardError, "boom" if call_count == 1
      "some digest"
    end

    described_class.perform_now

    expect(TelegramBot::Client).to have_received(:send_message).once
  end
end
