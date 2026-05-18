module DividendImports
  # Persists the broker rows after the user has confirmed (and optionally
  # supplied manual stock mappings for previously-unmatched rows).
  #
  # Upsert key: (user_id, stock_id, date, per_share_amount, source). Manual
  # rows (source='manual') are never touched even if their natural key matches.
  # `created`/`updated`/`skipped` counts go back to the UI summary.
  class Apply
    SOURCE = "ibkr".freeze

    def self.call(user:, rows:, manual_mapping: {})
      new(user: user, rows: rows, manual_mapping: manual_mapping).call
    end

    def initialize(user:, rows:, manual_mapping:)
      @user = user
      @rows = rows
      @manual_mapping = manual_mapping # { "TICKER" => stock_id, ... }
    end

    def call
      created = 0
      updated = 0
      skipped_unmatched = 0

      @rows.each do |row|
        stock_id = row[:stock_id] || @manual_mapping[row[:ticker]]
        if stock_id.blank?
          skipped_unmatched += 1
          next
        end

        attrs = {
          quantity: row[:quantity],
          per_share_amount: row[:per_share_amount],
          amount: row[:amount],
          currency: row[:currency],
          withholding_tax: row[:withholding_tax] || 0
        }

        existing = Dividend.find_by(
          user_id: @user.id,
          stock_id: stock_id,
          date: row[:date],
          per_share_amount: row[:per_share_amount],
          source: SOURCE
        )

        if existing
          existing.update!(attrs)
          updated += 1
        else
          Dividend.create!(attrs.merge(
            user_id: @user.id,
            stock_id: stock_id,
            date: row[:date],
            source: SOURCE
          ))
          created += 1
        end
      end

      { created: created, updated: updated, skipped: skipped_unmatched }
    end
  end
end
