require "nokogiri"

module DividendImporters
  # Parses MyInvestor's "Consulta de operaciones" export. The file extension
  # is `.xls` but the bytes are actually HTML (ISO-8859-1) with an Excel-style
  # table — that's how Inversis (MyInvestor's custodian) ships it, and Excel
  # opens it transparently.
  #
  # Table shape (one operation per row):
  #   Fechas (Op | Liq) | Operación id | Mercado | Operación type |
  #   ISIN | Valor | Títulos/NOMINAL | Divisa | Precio Neto | Importe neto
  #
  # We keep only rows where the "Operación type" column is "DIVIDENDO".
  # Withholding tax is not present in this export → withholding_tax = 0.
  class Myinvestor
    OPERATION_DIVIDEND = "DIVIDENDO".freeze

    def self.parse(io)
      new(io).parse
    end

    def initialize(io)
      @io = io
      @dividends = []
      @skipped = []
    end

    def parse
      raw = @io.read
      # File is declared ISO-8859-1; force-encode then transcode to UTF-8.
      raw = raw.force_encoding("ISO-8859-1").encode("UTF-8") if raw.encoding == Encoding::ASCII_8BIT
      doc = Nokogiri::HTML(raw)

      doc.css("table tr").each do |tr|
        # Inversis cells embed `&nbsp;` (U+00A0); plain String#strip ignores it.
        cells = tr.css("td").map { |td| td.text.to_s.tr(" ", " ").strip }
        next if cells.length < 11 # header rows + malformed

        operation_type = cells[4]
        next unless operation_type == OPERATION_DIVIDEND

        parse_dividend_row(cells)
      end

      {
        language: :es,
        dividends: @dividends,
        skipped: @skipped
      }
    end

    private

    # Expected cell positions (0-indexed) for a data row:
    #   0  fecha operación      (YYYY-MM-DD)
    #   1  fecha liquidación
    #   2  operación id
    #   3  mercado
    #   4  operación type ("DIVIDENDO")
    #   5  ISIN
    #   6  valor (name)
    #   7  títulos / nominal (quantity)
    #   8  divisa (currency)
    #   9  precio neto (per-share dividend)
    #   10 importe neto (total amount)
    def parse_dividend_row(cells)
      date = parse_date(cells[0])
      return @skipped << { reason: "bad_date", row: cells.join(" | ") } unless date

      isin = cells[5].to_s.strip
      return @skipped << { reason: "no_isin", row: cells.join(" | ") } if isin.blank?

      name = cells[6].to_s.strip
      ticker = derive_ticker(name)
      currency = cells[8].to_s.strip
      return @skipped << { reason: "bad_currency", row: cells.join(" | ") } unless currency =~ /\A[A-Z]{3}\z/

      quantity = parse_number(cells[7])&.to_i
      per_share = parse_number(cells[9])
      amount = parse_number(cells[10])
      return @skipped << { reason: "no_amount", row: cells.join(" | ") } if amount.nil? || amount.zero?

      @dividends << {
        ticker: ticker,
        isin: isin,
        currency: currency,
        date: date,
        per_share_amount: per_share,
        amount: amount,
        quantity: quantity,
        withholding_tax: BigDecimal("0")
      }
    end

    # Inversis dates come as YYYY-MM-DD (e.g. "2026-03-19"). The trailing
    # &nbsp; is already trimmed by Nokogiri text + strip.
    def parse_date(value)
      return nil if value.blank?
      Date.iso8601(value)
    rescue Date::Error
      nil
    end

    def parse_number(value)
      return nil if value.blank?
      # Inversis uses point as decimal separator in the x:num data attribute /
      # display cell (e.g. "0.0935296"). No thousands grouping.
      BigDecimal(value.to_s.tr(",", "."))
    rescue ArgumentError
      nil
    end

    # No ticker in the export — derive a best-effort one from the asset name
    # so that the UI's "manual mapping" can still show something readable. The
    # real match happens via ISIN first.
    def derive_ticker(name)
      return "" if name.blank?
      # Strip common legal suffixes; take the first token in uppercase.
      cleaned = name.upcase.sub(/,?\s*(SA|S\.A\.|PLC|NV|AG|INC|CORP|UCITS|ETF|FUND)\b.*/, "")
      cleaned.split(/\s+/).first || name
    end
  end
end
