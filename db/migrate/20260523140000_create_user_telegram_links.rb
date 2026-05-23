class CreateUserTelegramLinks < ActiveRecord::Migration[8.0]
  def change
    create_table :user_telegram_links do |t|
      t.references :user, null: false, foreign_key: true
      # `code` is the one-time deep-link payload (`/start <code>`). Unique +
      # nullable so we can clear it once the link is established.
      t.string :code
      # Filled in when the user completes `/start <code>` in Telegram.
      t.string :chat_id
      t.string :telegram_user_id
      t.datetime :linked_at
      t.datetime :expires_at
      t.boolean :notifications_enabled, null: false, default: true
      t.timestamps
    end

    add_index :user_telegram_links, :code, unique: true, where: "code IS NOT NULL"
    # A Telegram account can link to at most one Quantic user at a time.
    add_index :user_telegram_links, :chat_id, unique: true, where: "chat_id IS NOT NULL"
    # One active link per Quantic user (the most recent).
    add_index :user_telegram_links, :user_id, unique: true,
              where: "linked_at IS NOT NULL", name: "index_user_telegram_links_active_per_user"
  end
end
