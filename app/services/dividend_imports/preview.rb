module DividendImports
  # Resolves the parsed broker rows against existing Stock data and returns a
  # preview the UI can render. The preview is *non-destructive* — nothing is
  # persisted until the user confirms via Apply with optional manual mappings.
  #
  # Resolution priority for each row:
  #   1. Match by ISIN (fills missing ISIN onto matched Stock — lazy backfill).
  #   2. Match by symbol (case-insensitive).
  #   3. Try the configured financial data provider with the ticker.
  #   4. Mark as `unmatched` — UI asks the user to pick / skip.
  class Preview
    def self.call(parsed:, user:)
      new(parsed: parsed, user: user).call
    end

    def initialize(parsed:, user:)
      @parsed = parsed
      @user = user
    end

    def call
      resolved = []
      unmatched = []

      @parsed[:dividends].each do |row|
        stock = resolve_stock(row)
        if stock
          backfill_isin(stock, row[:isin])
          resolved << row.merge(stock_id: stock.id, stock_symbol: stock.symbol, stock_name: stock.name)
        else
          unmatched << row.merge(reason: "no_match")
        end
      end

      {
        language: @parsed[:language],
        resolved: resolved,
        unmatched: unmatched,
        skipped: @parsed[:skipped]
      }
    end

    private

    def resolve_stock(row)
      Stock.find_by(isin: row[:isin]) ||
        Stock.find_by("UPPER(symbol) = ?", row[:ticker].upcase) ||
        try_provider_lookup(row[:ticker])
    end

    # Use the configured provider to create a Stock row from a ticker we haven't
    # seen. Returns the Stock on success, nil on any failure — failures are
    # expected (e.g. delisted, exchange suffix mismatch) and surface as
    # "unmatched" for manual resolution.
    def try_provider_lookup(ticker)
      provider = Rails.application.config.financial_data_provider.new
      provider.get_stock(ticker)
    rescue StandardError
      nil
    end

    def backfill_isin(stock, isin)
      return if isin.blank? || stock.isin.present?
      stock.update_column(:isin, isin)
    end
  end
end
