require "rails_helper"

RSpec.describe "Api::V1::TelegramLinks", type: :request do
  let(:user) { create(:user) }

  before do
    sign_in user
    ENV["TELEGRAM_BOT_HANDLE"] = "QuanticAppBot"
  end

  after { ENV.delete("TELEGRAM_BOT_HANDLE") }

  describe "GET /api/v1/telegram_link" do
    it "returns connected: false when the user has no link" do
      get "/api/v1/telegram_link"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["data"]).to eq("connected" => false)
    end

    it "returns the link details when the user is linked" do
      UserTelegramLink.create!(user: user, chat_id: "123", telegram_user_id: "u", linked_at: Time.current)
      get "/api/v1/telegram_link"
      data = JSON.parse(response.body)["data"]
      expect(data["connected"]).to be(true)
      expect(data["telegramUserId"]).to eq("u")
    end
  end

  describe "POST /api/v1/telegram_link" do
    it "issues a fresh code + deep-link URL" do
      post "/api/v1/telegram_link"
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)["data"]
      expect(data["code"]).to be_present
      expect(data["deepLinkUrl"]).to start_with("https://t.me/QuanticAppBot?start=")
      expect(data["expiresAt"]).to be_present
    end

    it "503s when the bot handle isn't configured" do
      ENV.delete("TELEGRAM_BOT_HANDLE")
      post "/api/v1/telegram_link"
      expect(response).to have_http_status(:service_unavailable)
    end
  end

  describe "DELETE /api/v1/telegram_link" do
    it "removes the user's link rows and confirms" do
      UserTelegramLink.create!(user: user, chat_id: "123", telegram_user_id: "u", linked_at: Time.current)
      delete "/api/v1/telegram_link"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["data"]).to eq("unlinked" => true)
      expect(UserTelegramLink.where(user: user)).to be_empty
    end
  end
end
