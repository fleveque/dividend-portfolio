require "rails_helper"

# Targeted coverage for the User#publish_pulse_changes after-commit:
# the 6 transitions across (slug, share_portfolio, share_radar).
RSpec.describe "User Pulse publishing", type: :model do
  before { allow(NatsPublisher).to receive(:publish) }

  describe "setting a slug for the first time" do
    it "publishes portfolio.opted_in (default share_portfolio=true)" do
      user = create(:user)
      user.update!(portfolio_slug: "alice")
      expect(NatsPublisher).to have_received(:publish).with("portfolio.opted_in", anything)
    end

    it "also publishes radar.opted_in when share_radar is set on the same save" do
      user = create(:user)
      user.update!(portfolio_slug: "alice", share_radar: true)
      expect(NatsPublisher).to have_received(:publish).with("portfolio.opted_in", anything)
      expect(NatsPublisher).to have_received(:publish).with("radar.opted_in", anything)
    end

    it "doesn't publish portfolio.opted_in when share_portfolio is false" do
      user = create(:user, share_portfolio: false)
      user.update!(portfolio_slug: "alice")
      expect(NatsPublisher).not_to have_received(:publish).with("portfolio.opted_in", anything)
    end
  end

  describe "clearing the slug" do
    it "publishes opted_out for whichever surfaces were active" do
      user = create(:user, portfolio_slug: "alice", share_portfolio: true, share_radar: true)
      user.update!(portfolio_slug: nil)
      expect(NatsPublisher).to have_received(:publish).with("portfolio.opted_out", hash_including(slug: "alice"))
      expect(NatsPublisher).to have_received(:publish).with("radar.opted_out", hash_including(slug: "alice"))
    end
  end

  describe "flipping share_radar on" do
    it "publishes radar.opted_in (slug already present)" do
      user = create(:user, portfolio_slug: "alice", share_radar: false)
      user.update!(share_radar: true)
      expect(NatsPublisher).to have_received(:publish).with("radar.opted_in", anything)
    end
  end

  describe "flipping share_radar off" do
    it "publishes radar.opted_out (slug stays present)" do
      user = create(:user, portfolio_slug: "alice", share_radar: true)
      user.update!(share_radar: false)
      expect(NatsPublisher).to have_received(:publish).with("radar.opted_out", hash_including(slug: "alice"))
    end
  end

  describe "flipping share_portfolio off (slug present)" do
    it "publishes portfolio.opted_out without touching radar" do
      user = create(:user, portfolio_slug: "alice", share_portfolio: true, share_radar: false)
      user.update!(share_portfolio: false)
      expect(NatsPublisher).to have_received(:publish).with("portfolio.opted_out", hash_including(slug: "alice"))
      expect(NatsPublisher).not_to have_received(:publish).with("radar.opted_in", anything)
      expect(NatsPublisher).not_to have_received(:publish).with("radar.opted_out", anything)
    end
  end

  describe "no relevant change" do
    it "doesn't publish anything when changing preferred_currency only" do
      user = create(:user, portfolio_slug: "alice")
      # Reset the spy: the create(:user, portfolio_slug:) above fires the
      # opt-in for the initial slug set; we only care about the next update.
      RSpec::Mocks.space.proxy_for(NatsPublisher).reset
      allow(NatsPublisher).to receive(:publish)

      user.update!(preferred_currency: "EUR")
      expect(NatsPublisher).not_to have_received(:publish)
    end
  end
end
