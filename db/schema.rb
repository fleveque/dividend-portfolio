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

ActiveRecord::Schema[8.0].define(version: 2026_01_29_065032) do
  create_table "dividends", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "stock_id", null: false
    t.decimal "amount"
    t.date "date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id"], name: "index_dividends_on_stock_id"
    t.index ["user_id"], name: "index_dividends_on_user_id"
  end

  create_table "radar_stocks", id: false, force: :cascade do |t|
    t.integer "radar_id", null: false
    t.integer "stock_id", null: false
    t.decimal "target_price"
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
    t.index ["symbol"], name: "index_stocks_on_symbol", unique: true
  end

  create_table "transactions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "stock_id", null: false
    t.string "transaction_type"
    t.integer "quantity"
    t.decimal "price"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id"], name: "index_transactions_on_stock_id"
    t.index ["user_id"], name: "index_transactions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "dividends", "stocks"
  add_foreign_key "dividends", "users"
  add_foreign_key "radar_stocks", "radars", on_delete: :cascade
  add_foreign_key "radar_stocks", "stocks", on_delete: :cascade
  add_foreign_key "radars", "users"
  add_foreign_key "sessions", "users"
  add_foreign_key "transactions", "stocks"
  add_foreign_key "transactions", "users"
end
