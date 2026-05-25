RSpec.describe "Api::V1::Admin::Dashboard", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }

  describe "GET /api/v1/admin/dashboard" do
    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/admin/dashboard"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Authentication required")
      end
    end

    context "when authenticated as regular user" do
      before { sign_in user }

      it "returns 403 forbidden" do
        get "/api/v1/admin/dashboard"

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["error"]).to eq("Forbidden")
      end
    end

    context "when authenticated as admin" do
      before { sign_in admin }

      it "returns dashboard stats" do
        # Create some data for stats
        users = create_list(:user, 2)
        stock = create(:stock, symbol: "AAPL", price: 150.00)
        create(:stock, symbol: "GOOGL", price: nil)
        create(:holding, user: users.first, stock: stock, quantity: 10, average_price: 100.00)
        users.first.update!(portfolio_slug: "test-slug")

        get "/api/v1/admin/dashboard"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true

        data = json["data"]
        expect(data["users"]["total"]).to eq(3) # admin + 2 users
        expect(data["users"]["admins"]).to eq(1)
        expect(data["stocks"]["total"]).to eq(2)
        expect(data["stocks"]["withPrice"]).to eq(1)
        expect(data["stocks"]["withoutPrice"]).to eq(1)
        expect(data["radars"]).to be_present
        expect(data["buyPlans"]).to be_present
        expect(data).not_to have_key("transactions")

        # Holdings stats
        expect(data["holdings"]["totalHoldings"]).to eq(1)
        expect(data["holdings"]["usersWithHoldings"]).to eq(1)
        expect(data["holdings"]["avgHoldingsPerUser"]).to eq(1.0)

        # Pulse stats
        expect(data["pulse"]["usersWithSlug"]).to eq(1)
        expect(data["pulse"]["adoptionRate"]).to be > 0
      end

      describe "dividends block" do
        let!(:manual_user) { create(:user) }
        let!(:importer) { create(:user) }

        before do
          create(:dividend, user: manual_user, source: "manual")
          create(:dividend, :ibkr, user: importer)
          create(:dividend, :ibkr, user: importer) # second imported row for same user
        end

        it "exposes dividend adoption + record counts" do
          get "/api/v1/admin/dashboard"
          dividends = JSON.parse(response.body)["data"]["dividends"]

          expect(dividends["usersWithAny"]).to eq(2)
          expect(dividends["usersImporting"]).to eq(1)
          expect(dividends["usersManualOnly"]).to eq(1)
          expect(dividends["totalRecords"]).to eq(3)
          expect(dividends["importedRecords"]).to eq(2)
          expect(dividends["manualRecords"]).to eq(1)
          expect(dividends["adoptionRate"]).to be > 0
        end
      end

      describe "ai section" do
        it "is empty / zeroed when no AI calls have been made" do
          get "/api/v1/admin/dashboard"
          ai = JSON.parse(response.body)["data"]["ai"]
          expect(ai["callsToday"]).to eq(0)
          expect(ai["callsLast7d"]).to eq(0)
          expect(ai["callsLast30d"]).to eq(0)
          expect(ai["byFeature"]).to eq({})
          expect(ai["byProvider"]).to eq({})
          expect(ai["topUsers"]).to eq([])
          expect(ai["usersAtQuotaToday"]).to eq(0)
          expect(ai["dailyLimit"]).to eq(AiRateLimiter::DAILY_LIMIT)
        end

        it "aggregates calls by feature, provider, and user over the relevant windows" do
          alice = create(:user, email_address: "alice@example.com")
          bob = create(:user, email_address: "bob@example.com")
          # Today
          AiRequest.create!(user: alice, feature: "radar_insights", provider: "gemini", created_at: 1.hour.ago)
          AiRequest.create!(user: alice, feature: "telegram_chat", provider: "gemini", created_at: 2.hours.ago)
          AiRequest.create!(user: bob, feature: "stock_summary", provider: "gemini", created_at: 30.minutes.ago)
          # Within 7d window but not today
          AiRequest.create!(user: bob, feature: "telegram_chat", provider: "gemini", created_at: 3.days.ago)
          # Outside 30d window
          AiRequest.create!(user: alice, feature: "radar_insights", provider: "gemini", created_at: 90.days.ago)

          get "/api/v1/admin/dashboard"
          ai = JSON.parse(response.body)["data"]["ai"]
          expect(ai["callsToday"]).to eq(3)
          expect(ai["callsLast7d"]).to eq(4)
          expect(ai["callsLast30d"]).to eq(4)
          expect(ai["byFeature"]).to include("radar_insights" => 1, "telegram_chat" => 2, "stock_summary" => 1)
          expect(ai["byProvider"]).to eq({ "gemini" => 4 })
          expect(ai["topUsers"]).to contain_exactly(
            { "email" => "alice@example.com", "count" => 2 },
            { "email" => "bob@example.com", "count" => 2 }
          )
        end

        it "counts non-admin users at quota today" do
          regular = create(:user)
          AiRateLimiter::DAILY_LIMIT.times { AiRequest.create!(user: regular, feature: "radar_insights", provider: "gemini") }
          # Admin going over the cap doesn't count (admins bypass the limiter)
          admin_2 = create(:user, :admin)
          (AiRateLimiter::DAILY_LIMIT + 2).times { AiRequest.create!(user: admin_2, feature: "radar_insights", provider: "gemini") }

          get "/api/v1/admin/dashboard"
          ai = JSON.parse(response.body)["data"]["ai"]
          expect(ai["usersAtQuotaToday"]).to eq(1)
        end
      end

      describe "telegram section" do
        it "is empty / zeroed when nobody has linked Telegram" do
          get "/api/v1/admin/dashboard"
          telegram = JSON.parse(response.body)["data"]["telegram"]
          expect(telegram["linkedUsers"]).to eq(0)
          expect(telegram["linkedLast7d"]).to eq(0)
          expect(telegram["linkedLast30d"]).to eq(0)
          expect(telegram["notificationsEnabled"]).to eq(0)
          expect(telegram["botQuestionsLast7d"]).to eq(0)
          expect(telegram["botQuestionsLast30d"]).to eq(0)
          expect(telegram["topBotUsers"]).to eq([])
        end

        it "reports linked users, notifications-enabled, and bot questions over time" do
          alice = create(:user, email_address: "alice@example.com")
          bob = create(:user, email_address: "bob@example.com")
          UserTelegramLink.create!(user: alice, chat_id: "1", telegram_user_id: "u1", linked_at: 1.day.ago, notifications_enabled: true)
          UserTelegramLink.create!(user: bob, chat_id: "2", telegram_user_id: "u2", linked_at: 10.days.ago, notifications_enabled: false)
          # Bot questions only count when feature == telegram_chat
          AiRequest.create!(user: alice, feature: "telegram_chat", provider: "gemini", created_at: 1.day.ago)
          AiRequest.create!(user: alice, feature: "telegram_chat", provider: "gemini", created_at: 5.days.ago)
          AiRequest.create!(user: bob, feature: "telegram_chat", provider: "gemini", created_at: 20.days.ago)
          AiRequest.create!(user: alice, feature: "radar_insights", provider: "gemini") # ignored

          get "/api/v1/admin/dashboard"
          telegram = JSON.parse(response.body)["data"]["telegram"]
          expect(telegram["linkedUsers"]).to eq(2)
          expect(telegram["linkedLast7d"]).to eq(1)
          expect(telegram["linkedLast30d"]).to eq(2)
          expect(telegram["notificationsEnabled"]).to eq(1)
          expect(telegram["botQuestionsLast7d"]).to eq(2)
          expect(telegram["botQuestionsLast30d"]).to eq(3)
          expect(telegram["topBotUsers"].first).to eq({ "email" => "alice@example.com", "count" => 2 })
        end
      end

      describe "activity section" do
        it "exposes active-user, holding-change, and weekly-active-users metrics" do
          # Sessions: one in *this* week (anchored to current week's Monday so
          # the test doesn't drift across week boundaries on different weekdays),
          # one older (between 7-30d), one stale.
          fresh   = create(:user)
          warm    = create(:user)
          old     = create(:user)
          this_week_time = Time.current.beginning_of_week + 1.minute
          create(:session, user: fresh, created_at: this_week_time, updated_at: this_week_time)
          create(:session, user: warm,  created_at: 15.days.ago, updated_at: 15.days.ago)
          create(:session, user: old,   created_at: 90.days.ago, updated_at: 90.days.ago)

          # Holding changes: one recent.
          stock = create(:stock, symbol: "AAPL", price: 150.00)
          create(:holding, user: fresh, stock: stock, quantity: 1, average_price: 100, created_at: 1.hour.ago, updated_at: 1.hour.ago)

          get "/api/v1/admin/dashboard"

          act = JSON.parse(response.body)["data"]["activity"]
          # Admin's own sign_in creates a fresh session, so 7d active count includes admin + fresh user.
          expect(act["activeUsers7d"]).to be >= 2
          expect(act["activeUsers30d"]).to be >= 3
          expect(act["holdingChanges7d"]).to be >= 1
          expect(act["usersTouchingHoldings7d"]).to eq(1)
          expect(act["activeUsersTrend"]).to be_an(Array)
          expect(act["activeUsersTrend"].size).to eq(8)
          act["activeUsersTrend"].each do |bucket|
            expect(bucket).to include("weekStart", "count")
          end

          # Buckets contain *distinct user counts*, not session counts.
          # This week's bucket should include the fresh user we placed there
          # plus admin's own sign_in.
          this_week = act["activeUsersTrend"].last
          expect(this_week["count"]).to be >= 2
        end
      end
    end
  end
end
