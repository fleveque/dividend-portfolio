# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_05_27_190733) do
  create_table "ai_requests", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "feature", null: false
    t.string "provider", null: false
    t.datetime "created_at", null: false
    t.index ["user_id", "created_at"], name: "index_ai_requests_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_ai_requests_on_user_id"
  end

  create_table "buy_plan_items", force: :cascade do |t|
    t.integer "buy_plan_id", null: false
    t.integer "stock_id", null: false
    t.integer "quantity", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["buy_plan_id", "stock_id"], name: "index_buy_plan_items_on_buy_plan_id_and_stock_id", unique: true
    t.index ["buy_plan_id"], name: "index_buy_plan_items_on_buy_plan_id"
    t.index ["stock_id"], name: "index_buy_plan_items_on_stock_id"
  end

  create_table "buy_plans", force: :cascade do |t|
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_buy_plans_on_user_id", unique: true
  end

  create_table "content_drafts", force: :cascade do |t|
    t.string "topic_type", null: false
    t.string "topic_key", null: false
    t.json "payload", null: false
    t.json "inputs"
    t.datetime "generated_at", null: false
    t.datetime "copied_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["generated_at"], name: "index_content_drafts_on_generated_at"
    t.index ["topic_type", "topic_key"], name: "index_content_drafts_on_topic_type_and_topic_key"
  end

  create_table "dividends", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "stock_id", null: false
    t.decimal "amount"
    t.date "date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "quantity"
    t.decimal "per_share_amount", precision: 12, scale: 6
    t.string "currency", default: "USD", null: false
    t.decimal "withholding_tax", precision: 12, scale: 4, default: "0.0", null: false
    t.string "source", default: "manual", null: false
    t.index ["stock_id"], name: "index_dividends_on_stock_id"
    t.index ["user_id", "stock_id", "date", "per_share_amount", "source"], name: "index_dividends_on_dedup_key", unique: true, where: "per_share_amount IS NOT NULL"
    t.index ["user_id"], name: "index_dividends_on_user_id"
  end

  create_table "fx_rates", force: :cascade do |t|
    t.string "base", null: false
    t.string "quote", null: false
    t.decimal "rate", precision: 18, scale: 8, null: false
    t.datetime "fetched_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["base", "quote"], name: "index_fx_rates_on_base_and_quote", unique: true
  end

  create_table "holdings", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "stock_id", null: false
    t.decimal "quantity", precision: 12, scale: 4, null: false
    t.decimal "average_price", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id"], name: "index_holdings_on_stock_id"
    t.index ["user_id", "stock_id"], name: "index_holdings_on_user_id_and_stock_id", unique: true
    t.index ["user_id"], name: "index_holdings_on_user_id"
  end

  create_table "radar_stocks", id: false, force: :cascade do |t|
    t.integer "radar_id", null: false
    t.integer "stock_id", null: false
    t.decimal "target_price"
    t.datetime "notified_below_target_at"
    t.index ["radar_id", "stock_id"], name: "index_radar_stocks_on_radar_id_and_stock_id"
    t.index ["stock_id", "radar_id"], name: "index_radar_stocks_on_stock_id_and_radar_id"
  end

  create_table "radars", force: :cascade do |t|
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_radars_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "stocks", force: :cascade do |t|
    t.string "symbol", null: false
    t.string "name"
    t.decimal "price", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "eps", precision: 10, scale: 4
    t.decimal "pe_ratio", precision: 10, scale: 2
    t.decimal "dividend", precision: 10, scale: 4
    t.decimal "dividend_yield", precision: 10, scale: 4
    t.decimal "payout_ratio", precision: 10, scale: 4
    t.decimal "ma_50", precision: 10, scale: 2
    t.decimal "ma_200", precision: 10, scale: 2
    t.date "ex_dividend_date"
    t.string "payment_frequency"
    t.json "payment_months"
    t.json "shifted_payment_months"
    t.decimal "fifty_two_week_high", precision: 10, scale: 2
    t.decimal "fifty_two_week_low", precision: 10, scale: 2
    t.string "currency", default: "USD", null: false
    t.string "sector"
    t.string "industry"
    t.string "isin"
    t.index ["isin"], name: "index_stocks_on_isin", unique: true, where: "isin IS NOT NULL"
    t.index ["symbol"], name: "index_stocks_on_symbol", unique: true
  end

  create_table "user_telegram_links", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "code"
    t.string "chat_id"
    t.string "telegram_user_id"
    t.datetime "linked_at"
    t.datetime "expires_at"
    t.boolean "notifications_enabled", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["chat_id"], name: "index_user_telegram_links_on_chat_id", unique: true, where: "chat_id IS NOT NULL"
    t.index ["code"], name: "index_user_telegram_links_on_code", unique: true, where: "code IS NOT NULL"
    t.index ["user_id"], name: "index_user_telegram_links_active_per_user", unique: true, where: "linked_at IS NOT NULL"
    t.index ["user_id"], name: "index_user_telegram_links_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "provider"
    t.string "uid"
    t.string "name"
    t.boolean "admin", default: false, null: false
    t.string "portfolio_slug"
    t.string "preferred_currency", default: "USD", null: false
    t.boolean "share_portfolio", default: true, null: false
    t.boolean "share_radar", default: false, null: false
    t.string "locale", default: "en", null: false
    t.decimal "motivation_monthly_invest", precision: 12, scale: 2
    t.decimal "motivation_monthly_objective", precision: 12, scale: 2
    t.decimal "motivation_inflation_pct", precision: 5, scale: 2, default: "2.5"
    t.decimal "motivation_yield_override_pct", precision: 5, scale: 2
    t.integer "motivation_start_year"
    t.decimal "motivation_interest_capital", precision: 14, scale: 2
    t.decimal "motivation_interest_rate_pct", precision: 5, scale: 2
    t.decimal "motivation_growth_capital", precision: 14, scale: 2
    t.decimal "motivation_growth_rate_pct", precision: 5, scale: 2
    t.boolean "motivation_reinvest_interest", default: true, null: false
    t.integer "motivation_birth_year"
    t.integer "motivation_retirement_age"
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
    t.index ["portfolio_slug"], name: "index_users_on_portfolio_slug", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
  end

  add_foreign_key "ai_requests", "users"
  add_foreign_key "buy_plan_items", "buy_plans"
  add_foreign_key "buy_plan_items", "stocks"
  add_foreign_key "buy_plans", "users"
  add_foreign_key "dividends", "stocks"
  add_foreign_key "dividends", "users"
  add_foreign_key "holdings", "stocks"
  add_foreign_key "holdings", "users"
  add_foreign_key "radar_stocks", "radars", on_delete: :cascade
  add_foreign_key "radar_stocks", "stocks", on_delete: :cascade
  add_foreign_key "radars", "users"
  add_foreign_key "sessions", "users"
  add_foreign_key "user_telegram_links", "users"
end
