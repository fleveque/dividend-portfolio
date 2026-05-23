require "rails_helper"

# Regression suite: assert at the tool layer that there is no path for user A's
# bot session to reach user B's data. The mechanism is straightforward — each
# tool's handler closes over its user — but it's exactly the kind of invariant
# that quietly breaks when someone "refactors for reuse" later. Lock it down.
RSpec.describe "TelegramBot user isolation", type: :service do
  let(:alice) { create(:user, email_address: "alice@example.com") }
  let(:bob)   { create(:user, email_address: "bob@example.com") }

  let(:alice_stock) { create(:stock, symbol: "ALC", price: 100) }
  let(:bob_stock)   { create(:stock, symbol: "BOB", price: 200) }

  before do
    # Alice has 50 ALC, Bob has 10 BOB. Their data should never bleed across.
    create(:holding, user: alice, stock: alice_stock, quantity: 50, average_price: 90)
    create(:holding, user: bob, stock: bob_stock, quantity: 10, average_price: 180)
    create(:dividend, user: alice, stock: alice_stock, amount: 25, currency: "USD", date: Date.current)
    create(:dividend, user: bob, stock: bob_stock, amount: 99, currency: "USD", date: Date.current)
    radar_a = create(:radar, user: alice)
    RadarStock.create!(radar: radar_a, stock: alice_stock, target_price: 95)
    radar_b = create(:radar, user: bob)
    RadarStock.create!(radar: radar_b, stock: bob_stock, target_price: 195)
  end

  describe "tools built for Alice" do
    let(:tools) { TelegramBot::Tools.all_for(alice) }

    it "GetHoldings only returns Alice's holdings, regardless of args the LLM might pass" do
      result = tools.find { |t| t.name == "get_holdings" }.invoke({})
      symbols = result[:holdings].map { |h| h[:symbol] }
      expect(symbols).to eq([ "ALC" ])
      expect(symbols).not_to include("BOB")
    end

    it "GetRadar only returns Alice's radar entries" do
      result = tools.find { |t| t.name == "get_radar" }.invoke({})
      symbols = result[:stocks].map { |s| s[:symbol] }
      expect(symbols).to eq([ "ALC" ])
    end

    it "GetRecentDividends only returns Alice's dividends" do
      result = tools.find { |t| t.name == "get_recent_dividends" }.invoke({})
      amounts = result[:dividends].map { |d| d[:amount] }
      expect(amounts).to eq([ 25.0 ])
      expect(amounts).not_to include(99.0)
    end

    it "GetDividendSummary aggregates only over Alice's dividends" do
      result = tools.find { |t| t.name == "get_dividend_summary" }.invoke({ period: "this_month" })
      expect(result[:currencies]["USD"][:gross]).to eq(25.0)
    end

    it "GetUpcomingExDivs only considers Alice's held / radar stock_ids" do
      # Give Bob's stock an ex-div in the window so it WOULD match if Alice's
      # tool weren't scoped — and prove it doesn't appear.
      bob_stock.update!(ex_dividend_date: 2.days.from_now)
      alice_stock.update!(ex_dividend_date: 2.days.from_now)
      result = tools.find { |t| t.name == "get_upcoming_ex_divs" }.invoke({ days: 7 })
      symbols = result[:stocks].map { |s| s[:symbol] }
      expect(symbols).to eq([ "ALC" ])
    end

    it "no tool accepts a user / user_id / email parameter (the LLM has no way to request someone else)" do
      tool_params = tools.flat_map { |t| t.parameters.dig(:properties)&.keys || [] }
      forbidden = %w[user user_id userId email email_address account_id]
      expect(tool_params.map(&:to_s) & forbidden).to be_empty
    end
  end
end
