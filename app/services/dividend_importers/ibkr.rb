require "csv"

module DividendImporters
  # Parses IBKR Activity Statement CSVs (Spanish and English locales).
  #
  # The file is a multi-section CSV — each row's first column tells you which
  # section it belongs to. We care about two sections:
  #   - "Dividendos" / "Dividends" — cash dividends paid
  #   - "Retención de impuestos" / "Withholding Tax" — tax withheld at source
  #
  # The description column packs ticker, ISIN, per-share amount and currency.
  # Withholding rows mirror the dividend's description (without the trailing
  # type tag) which lets us pair them by (ticker, date, per_share, currency).
  #
  # Sample dividend row (ES):
  #   Dividendos,Data,USD,2025-01-02,NKE(US6541061031) Dividendo en efectivo USD 0.40 por acción (Dividendo ordinario),2.8
  #
  # Sample withholding row (ES):
  #   Retención de impuestos,Data,USD,2025-01-02,NKE(US6541061031) Dividendo en efectivo USD 0.40 por acción - US Impuestos,-0.42
  class Ibkr
    SECTION_DIVIDENDS = { "Dividendos" => :es, "Dividends" => :en }.freeze
    SECTION_WITHHOLDING = {
      "Retención de impuestos" => :es,
      "Withholding Tax" => :en
    }.freeze

    # Captures: ticker, isin, currency, per_share_amount
    # Handles the variants seen in real exports:
    #   - "NKE(US6541061031) Dividendo en efectivo USD 0.40 por acción ..."
    #   - "SBUX (US8552441094) Dividendo en efectivo USD 0.61 ..."   (space before isin, no "por acción")
    #   - English: "NKE(US6541061031) Cash Dividend USD 0.40 per share ..."
    DESCRIPTION_RE = /
      \A
      (?<ticker>[A-Z0-9.]+(?:\s[A-Z0-9.]+)?)\s*
      \((?<isin>[A-Z]{2}[A-Z0-9]{10})\)\s+
      (?:Dividendo\sen\sefectivo|Cash\sDividend)\s+
      (?<currency>[A-Z]{3})\s+
      (?<per_share>[\d.]+)
    /x

    # "Pago en Lugar de Dividendo" / "Payment in Lieu of Dividend" rows lack a
    # per-share figure (common for short-lending payouts). We skip them in v1.
    PAYMENT_IN_LIEU_RE = /Pago\sen\sLugar\sde\sDividendo|Payment\sIn\sLieu\sOf\sDividend/i

    def self.parse(io)
      new(io).parse
    end

    def initialize(io)
      @io = io
      @language = nil
      @dividends = []
      @withholdings = []
      @skipped = []
    end

    def parse
      content = @io.read.force_encoding("utf-8").sub(/\A\xEF\xBB\xBF/, "") # strip BOM
      CSV.parse(content, liberal_parsing: true) do |row|
        next if row.blank? || row[1] != "Data"

        section = row[0]
        if SECTION_DIVIDENDS.key?(section)
          @language ||= SECTION_DIVIDENDS[section]
          parse_dividend_row(row)
        elsif SECTION_WITHHOLDING.key?(section)
          @language ||= SECTION_WITHHOLDING[section]
          parse_withholding_row(row)
        end
      end

      pair_withholdings_into_dividends!

      {
        language: @language,
        dividends: @dividends,
        skipped: @skipped
      }
    end

    private

    # Each dividend/withholding row shape: [section, "Data", currency, date, description, amount, ...]
    # Total rows have non-currency strings ("Total", "Total en EUR") in column 2 — skip those.
    def parse_dividend_row(row)
      currency = row[2]
      return unless currency =~ /\A[A-Z]{3}\z/

      description = row[4].to_s
      if description =~ PAYMENT_IN_LIEU_RE
        @skipped << { reason: "payment_in_lieu", row: row.compact.join(",") }
        return
      end

      match = DESCRIPTION_RE.match(description)
      return @skipped << { reason: "unparseable", row: row.compact.join(",") } unless match

      date = Date.parse(row[3]) rescue (return @skipped << { reason: "bad_date", row: row.compact.join(",") })
      amount = BigDecimal(row[5].to_s)
      per_share = BigDecimal(match[:per_share])
      quantity = (amount / per_share).round

      @dividends << {
        ticker: match[:ticker].strip,
        isin: match[:isin],
        currency: match[:currency],
        date: date,
        per_share_amount: per_share,
        amount: amount,
        quantity: quantity,
        withholding_tax: BigDecimal("0")
      }
    end

    def parse_withholding_row(row)
      currency = row[2]
      return unless currency =~ /\A[A-Z]{3}\z/

      description = row[4].to_s
      match = DESCRIPTION_RE.match(description)
      return unless match # quietly skip unparseable tax rows; they'll show as 0 tax

      date = Date.parse(row[3]) rescue return
      amount = BigDecimal(row[5].to_s)

      @withholdings << {
        ticker: match[:ticker].strip,
        date: date,
        per_share: BigDecimal(match[:per_share]),
        currency: match[:currency],
        amount: amount
      }
    end

    # Sum withholding rows per (ticker, date, per_share, currency) — correction
    # pairs (positive + negative for same payment) net out — and stitch the
    # absolute net onto the matching dividend row.
    def pair_withholdings_into_dividends!
      grouped = @withholdings.group_by do |w|
        [ w[:ticker], w[:date], w[:per_share], w[:currency] ]
      end

      grouped.transform_values! { |rows| rows.sum(BigDecimal("0")) { |r| r[:amount] }.abs }

      @dividends.each do |d|
        key = [ d[:ticker], d[:date], d[:per_share_amount], d[:currency] ]
        d[:withholding_tax] = grouped[key] || BigDecimal("0")
      end
    end
  end
end
