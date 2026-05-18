require 'rails_helper'

RSpec.describe "Api::V1::Admin::ContentDrafts", type: :request do
  let(:admin) { create(:user, admin: true) }
  let(:regular_user) { create(:user) }

  let(:payload) do
    {
      headline: "AAPL is paying its dividend",
      x: { text: "AAPL just paid 0.6%. Boring? Sure. Reliable? Also yes." },
      linkedin: { text: "A clean LinkedIn-style post about AAPL with one paragraph and a closer." },
      hashtags: %w[dividends]
    }
  end

  describe "GET /api/v1/admin/content_drafts" do
    context "as a non-admin" do
      before { sign_in regular_user }

      it "returns 403" do
        get "/api/v1/admin/content_drafts"
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "as an admin" do
      before { sign_in admin }

      it "returns the recent drafts in reverse-chronological order" do
        old = create(:content_draft, generated_at: 2.days.ago)
        newer = create(:content_draft, generated_at: 1.hour.ago)

        get "/api/v1/admin/content_drafts"

        expect(response).to have_http_status(:ok)
        ids = JSON.parse(response.body)["data"]["drafts"].map { |d| d["id"] }
        expect(ids).to eq([ newer.id, old.id ])
      end

      it "includes char lengths and truncation flags per platform" do
        create(:content_draft, payload: payload.merge(truncated_x: true))

        get "/api/v1/admin/content_drafts"
        draft = JSON.parse(response.body)["data"]["drafts"].first
        expect(draft["x"]["length"]).to eq(payload[:x][:text].length)
        expect(draft["x"]["truncated"]).to be true
        expect(draft["linkedin"]["truncated"]).to be false
      end
    end
  end

  describe "POST /api/v1/admin/content_drafts" do
    let!(:stock) { create(:stock, symbol: "AAPL", price: 175.0, dividend_yield: 0.6, payment_frequency: "quarterly", payment_months: [ 2, 5, 8, 11 ]) }

    before do
      sign_in admin
      # Bypass the dividend_score filter — that's covered in topic_selector_spec.
      allow(Stock).to receive(:top_scored).and_return([ stock ])
      allow(AiInsightsService).to receive(:social_post).and_return(payload)
    end

    it "auto-picks a category, generates via the AI provider, persists, and returns the serialized draft" do
      expect {
        post "/api/v1/admin/content_drafts", params: {}, as: :json
      }.to change(ContentDraft, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)["data"]
      expect(body["headline"]).to eq(payload[:headline])
      expect(body["x"]["text"]).to eq(payload[:x][:text])
      expect(body["linkedin"]["text"]).to eq(payload[:linkedin][:text])
    end

    it "honours an explicit category param" do
      post "/api/v1/admin/content_drafts", params: { category: "stock_of_the_day" }, as: :json
      expect(response).to have_http_status(:created)
      expect(ContentDraft.last.topic_type).to eq("stock_of_the_day")
    end

    it "returns 422 when an explicitly-picked category is unavailable today" do
      post "/api/v1/admin/content_drafts", params: { category: "feature_announcement" }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["error"]).to match(/feature_name/)
    end

    it "returns 503 when the AI provider raises" do
      allow(AiInsightsService).to receive(:social_post).and_raise(
        AiProviders::BaseProvider::AiError, "Gemini timeout"
      )
      post "/api/v1/admin/content_drafts", params: { category: "stock_of_the_day" }, as: :json
      expect(response).to have_http_status(:service_unavailable)
      expect(JSON.parse(response.body)["error"]).to include("Gemini timeout")
    end

    it "accepts feature_announcement extras and uses them as the topic key" do
      post "/api/v1/admin/content_drafts",
           params: { category: "feature_announcement", feature_name: "Multi Currency", description: "Convert any portfolio." },
           as: :json

      expect(response).to have_http_status(:created)
      expect(ContentDraft.last.topic_type).to eq("feature_announcement")
      expect(ContentDraft.last.topic_key).to eq("multi-currency")
    end
  end

  describe "PATCH /api/v1/admin/content_drafts/:id" do
    let!(:draft) { create(:content_draft) }

    before { sign_in admin }

    it "sets copied_at when copied=true" do
      patch "/api/v1/admin/content_drafts/#{draft.id}", params: { copied: true }, as: :json

      expect(response).to have_http_status(:ok)
      expect(draft.reload.copied_at).to be_within(2.seconds).of(Time.current)
    end

    it "clears copied_at when copied=false" do
      draft.update!(copied_at: 1.hour.ago)
      patch "/api/v1/admin/content_drafts/#{draft.id}", params: { copied: false }, as: :json

      expect(response).to have_http_status(:ok)
      expect(draft.reload.copied_at).to be_nil
    end
  end

  describe "DELETE /api/v1/admin/content_drafts/:id" do
    let!(:draft) { create(:content_draft) }

    context "as a non-admin" do
      before { sign_in regular_user }

      it "returns 403 and does not delete" do
        delete "/api/v1/admin/content_drafts/#{draft.id}"
        expect(response).to have_http_status(:forbidden)
        expect(ContentDraft.exists?(draft.id)).to be true
      end
    end

    context "as an admin" do
      before { sign_in admin }

      it "hard-deletes the draft so its topic becomes eligible for regeneration" do
        expect {
          delete "/api/v1/admin/content_drafts/#{draft.id}"
        }.to change(ContentDraft, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["data"]).to eq("deleted" => true)
      end
    end
  end
end
