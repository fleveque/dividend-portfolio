require "rails_helper"

RSpec.describe UserTelegramLink, type: :model do
  let(:user) { create(:user) }

  describe ".start_linking!" do
    it "creates a pending row with a code and 10-minute expiry" do
      link = described_class.start_linking!(user)
      expect(link.code).to be_present
      expect(link.expires_at).to be > 9.minutes.from_now
      expect(link).not_to be_linked
    end

    it "replaces existing pending codes for the same user" do
      first = described_class.start_linking!(user)
      second = described_class.start_linking!(user)
      expect(described_class.exists?(first.id)).to be(false)
      expect(described_class.exists?(second.id)).to be(true)
    end

    it "leaves an existing linked row alone" do
      established = described_class.create!(user: user, chat_id: "999", telegram_user_id: "tu", linked_at: 1.day.ago)
      described_class.start_linking!(user)
      expect(described_class.exists?(established.id)).to be(true)
    end
  end

  describe ".consume_code" do
    it "returns the pending link for a valid, unexpired code" do
      link = described_class.start_linking!(user)
      expect(described_class.consume_code(link.code)).to eq(link)
    end

    it "returns nil for a missing code" do
      expect(described_class.consume_code("nope")).to be_nil
    end

    it "returns nil for an expired code" do
      link = described_class.start_linking!(user)
      link.update!(expires_at: 1.minute.ago)
      expect(described_class.consume_code(link.code)).to be_nil
    end
  end

  describe "#complete!" do
    it "fills in chat_id + telegram_user_id + linked_at and clears the code" do
      link = described_class.start_linking!(user)
      link.complete!(chat_id: "12345", telegram_user_id: "u42")

      link.reload
      expect(link.chat_id).to eq("12345")
      expect(link.telegram_user_id).to eq("u42")
      expect(link.linked_at).to be_present
      expect(link.code).to be_nil
    end

    it "wipes any prior link tied to the same chat" do
      stale = described_class.create!(user: create(:user), chat_id: "12345", telegram_user_id: "old", linked_at: 1.day.ago)
      link = described_class.start_linking!(user)
      link.complete!(chat_id: "12345", telegram_user_id: "u42")
      expect(described_class.exists?(stale.id)).to be(false)
    end
  end
end
