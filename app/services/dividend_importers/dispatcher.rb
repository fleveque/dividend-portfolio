module DividendImporters
  # Sniffs the uploaded file to pick the right parser, then returns the
  # detected source key along with the parsed payload. The source is
  # surfaced so downstream Apply can persist with the correct provenance.
  #
  # Detection is byte-level, no extension trust:
  #   - HTML/XML payload (starts with '<' or contains a <table>) → MyInvestor
  #     (Inversis HTML-as-XLS export format)
  #   - Anything else → IBKR (CSV-shaped Activity Statement)
  class Dispatcher
    def self.parse(tempfile)
      head = read_head(tempfile, 4_096)
      tempfile.rewind

      if myinvestor_shape?(head)
        { source: "myinvestor", **Myinvestor.parse(tempfile) }
      else
        { source: "ibkr", **Ibkr.parse(tempfile) }
      end
    end

    def self.read_head(io, bytes)
      head = io.read(bytes).to_s
      # Strip BOM if any so the shape sniff isn't fooled.
      head.force_encoding("utf-8") rescue head
    end

    # Inversis exports as HTML (mis-named `.xls`). The first non-whitespace
    # bytes are `<html` or `<?xml`, and the body always contains a `<table>`.
    def self.myinvestor_shape?(head)
      stripped = head.lstrip
      stripped.start_with?("<html", "<?xml", "<HTML") || stripped.match?(/<table/i)
    end
  end
end
