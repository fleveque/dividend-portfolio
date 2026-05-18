require "rails_helper"

RSpec.describe DividendImporters::Ibkr do
  describe ".parse (Spanish)" do
    let(:csv) do
      <<~CSV
        ﻿Statement,Header,Nombre del campo,Valor del campo,
        Statement,Data,BrokerName,Interactive Brokers Ireland Limited,
        Dividendos,Header,Divisa,Fecha,Descripción,Cantidad,
        Dividendos,Data,USD,2025-01-02,NKE(US6541061031) Dividendo en efectivo USD 0.40 por acción (Dividendo ordinario),2.8
        Dividendos,Data,USD,2025-02-15,O(US7561091049) Dividendo en efectivo USD 0.2565 por acción (Dividendo ordinario),2.31
        Dividendos,Data,USD,2025-02-28,SBUX (US8552441094) Dividendo en efectivo USD 0.61 (Dividendo ordinario),4.27
        Dividendos,Data,USD,2025-12-18,VFC(US9182041080) Pago en Lugar de Dividendo (in Lieu) (Dividendo ordinario),0.54
        Dividendos,Data,Total,,,442.41
        Retención de impuestos,Header,Divisa,Fecha,Descripción,Cantidad
        Retención de impuestos,Data,USD,2025-01-02,NKE(US6541061031) Dividendo en efectivo USD 0.40 por acción - US Impuestos,-0.42
        Retención de impuestos,Data,USD,2025-02-15,O(US7561091049) Dividendo en efectivo USD 0.2565 por acción - US Impuestos,0.19
        Retención de impuestos,Data,USD,2025-02-15,O(US7561091049) Dividendo en efectivo USD 0.2565 por acción - US Impuestos,-0.13
        Retención de impuestos,Data,Total,,,-0.36
      CSV
    end

    subject(:result) { described_class.parse(StringIO.new(csv)) }

    it "detects Spanish from section headers" do
      expect(result[:language]).to eq(:es)
    end

    it "parses ticker, ISIN, currency, per_share and quantity for each dividend" do
      nke = result[:dividends].find { |d| d[:ticker] == "NKE" }
      expect(nke).to include(
        ticker: "NKE", isin: "US6541061031", currency: "USD",
        date: Date.new(2025, 1, 2), per_share_amount: BigDecimal("0.40"),
        amount: BigDecimal("2.8"), quantity: 7
      )
    end

    it "handles description variants (space before ISIN, no 'por acción')" do
      sbux = result[:dividends].find { |d| d[:ticker] == "SBUX" }
      expect(sbux).to include(ticker: "SBUX", isin: "US8552441094", per_share_amount: BigDecimal("0.61"))
    end

    it "skips payment-in-lieu rows and reports them" do
      tickers = result[:dividends].map { |d| d[:ticker] }
      expect(tickers).not_to include("VFC")
      expect(result[:skipped].first[:reason]).to eq("payment_in_lieu")
    end

    it "skips total rows (non-3-letter currency column)" do
      expect(result[:dividends].size).to eq(3) # NKE, O, SBUX (not VFC, not totals)
    end

    it "pairs withholding tax to the matching dividend" do
      nke = result[:dividends].find { |d| d[:ticker] == "NKE" }
      expect(nke[:withholding_tax]).to eq(BigDecimal("0.42"))
    end

    it "nets correction pairs and takes absolute value" do
      o = result[:dividends].find { |d| d[:ticker] == "O" }
      # 0.19 + (-0.13) = 0.06 → stored as positive
      expect(o[:withholding_tax]).to eq(BigDecimal("0.06"))
    end

    it "leaves withholding at 0 when no tax row matches" do
      sbux = result[:dividends].find { |d| d[:ticker] == "SBUX" }
      expect(sbux[:withholding_tax]).to eq(BigDecimal("0"))
    end
  end

  describe ".parse (English)" do
    let(:csv) do
      <<~CSV
        ﻿Statement,Header,Field Name,Field Value
        Dividends,Header,Currency,Date,Description,Amount
        Dividends,Data,USD,2025-01-02,NKE(US6541061031) Cash Dividend USD 0.40 per share (Ordinary Dividend),2.8
        Withholding Tax,Header,Currency,Date,Description,Amount
        Withholding Tax,Data,USD,2025-01-02,NKE(US6541061031) Cash Dividend USD 0.40 per share - US Tax,-0.42
      CSV
    end

    subject(:result) { described_class.parse(StringIO.new(csv)) }

    it "detects English from section headers" do
      expect(result[:language]).to eq(:en)
    end

    it "parses dividends + withholding from English statements" do
      nke = result[:dividends].first
      expect(nke).to include(ticker: "NKE", per_share_amount: BigDecimal("0.40"), withholding_tax: BigDecimal("0.42"))
    end
  end

  describe ".parse (real CSV fixture)" do
    let(:fixture) { Rails.root.join("spec/fixtures/files/ibkr_activity_statement_es.csv") }

    it "smokes the full statement without crashing" do
      skip "fixture missing" unless File.exist?(fixture)
      result = described_class.parse(File.open(fixture, "rb"))
      expect(result[:dividends]).not_to be_empty
      expect(result[:language]).to eq(:es)
    end
  end
end
