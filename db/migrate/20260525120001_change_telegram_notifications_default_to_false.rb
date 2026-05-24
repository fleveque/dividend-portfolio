class ChangeTelegramNotificationsDefaultToFalse < ActiveRecord::Migration[8.0]
  # Opt-in by default: new links don't get the daily digest unless the user
  # explicitly enables it (Settings toggle or `/notifications on` in chat).
  # Existing rows are left as-is so already-opted-in users aren't silently
  # cut off.
  def up
    change_column_default :user_telegram_links, :notifications_enabled, from: true, to: false
  end

  def down
    change_column_default :user_telegram_links, :notifications_enabled, from: false, to: true
  end
end
