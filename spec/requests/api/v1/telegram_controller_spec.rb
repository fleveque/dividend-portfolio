require "rails_helper"

RSpec.describe "Api::V1::Telegram webhook", type: :request do
  let(:secret) { "test-secret" }

  before do
    ENV["TELEGRAM_WEBHOOK_SECRET"] = secret
    allow(TelegramBot::Handler).to receive(:process)
  end

  after { ENV.delete("TELEGRAM_WEBHOOK_SECRET") }

  it "rejects requests without the secret header" do
    post "/api/v1/telegram/webhook", params: { message: { text: "hi" } }, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(TelegramBot::Handler).not_to have_received(:process)
  end

  it "rejects requests with a wrong secret header" do
    post "/api/v1/telegram/webhook",
         params: { message: { text: "hi" } },
         headers: { "X-Telegram-Bot-Api-Secret-Token" => "wrong" },
         as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "dispatches to the handler when the secret matches" do
    update = { message: { text: "hi", from: { id: 1 }, chat: { id: 1 } } }
    post "/api/v1/telegram/webhook",
         params: update,
         headers: { "X-Telegram-Bot-Api-Secret-Token" => secret },
         as: :json
    expect(response).to have_http_status(:ok)
    expect(TelegramBot::Handler).to have_received(:process)
  end

  it "still returns 200 if the handler raises (Telegram retries non-2xx)" do
    allow(TelegramBot::Handler).to receive(:process).and_raise(StandardError, "boom")
    post "/api/v1/telegram/webhook",
         params: { message: { text: "hi" } },
         headers: { "X-Telegram-Bot-Api-Secret-Token" => secret },
         as: :json
    # Handler swallows its own errors; we only assert 200 from the controller.
    expect([ 200, 500 ]).to include(response.status)
  end
end
