require "securerandom"

# Maps a Quantic user to a Telegram chat. Rows start in the "pending" state
# (code present, linked_at nil, expires_at in the near future), then transition
# to "linked" once the user completes `/start <code>` in Telegram and we record
# their chat_id + telegram_user_id.
class UserTelegramLink < ApplicationRecord
  CODE_TTL = 10.minutes

  belongs_to :user

  scope :linked, -> { where.not(linked_at: nil) }
  scope :pending, -> { where(linked_at: nil) }
  scope :active_for, ->(user) { linked.where(user: user).order(linked_at: :desc) }

  # Generate a fresh pending link for `user`. Any existing pending links for
  # that user are deleted first (one in-flight code at a time) — but established
  # links are left alone.
  def self.start_linking!(user)
    pending.where(user: user).delete_all
    create!(
      user: user,
      code: SecureRandom.hex(16),
      expires_at: CODE_TTL.from_now
    )
  end

  # Look up a pending row by code, asserting it's still valid. Returns nil if
  # not found or expired so the caller can show the right error.
  def self.consume_code(code)
    return nil if code.blank?
    link = pending.find_by(code: code)
    return nil if link.nil? || link.expired?
    link
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def linked?
    linked_at.present?
  end

  def complete!(chat_id:, telegram_user_id:)
    # If this user already has an active link from a prior session, replace it.
    self.class.linked.where(user: user).where.not(id: id).delete_all
    # Same for any other link tied to this chat (e.g. user switched accounts).
    self.class.where(chat_id: chat_id.to_s).where.not(id: id).delete_all
    update!(
      code: nil,
      chat_id: chat_id.to_s,
      telegram_user_id: telegram_user_id.to_s,
      linked_at: Time.current,
      expires_at: nil
    )
  end
end
