require "rails_helper"

RSpec.describe DividendImporters::Myinvestor do
  let(:html) do
    <<~HTML
      <html><body>
        <table>
          <tr>
            <th>Op</th><th>Liq</th><th>Operación</th><th>Mercado</th><th>Operación</th>
            <th>ISIN</th><th>Valor</th><th>Títulos</th><th>Divisa</th>
            <th>Precio Neto</th><th>Importe neto</th>
          </tr>
          <tr>
            <td>2026-03-19</td><td>2026-03-20</td><td>123</td><td>GENERICO</td>
            <td>DIVIDENDO</td><td>IE0003UVYC20</td><td>JPM GL PREM INC UCITS ETF</td>
            <td>50</td><td>EUR</td><td>0.0935296</td><td>4.68</td>
          </tr>
          <tr>
            <td>2026-01-14</td><td>2026-01-14</td><td>456</td><td>GENERICO</td>
            <td>DIVIDENDO</td><td>ES0173516115</td><td>REPSOL, SA</td>
            <td>50</td><td>EUR</td><td>0.4050000</td><td>20.25</td>
          </tr>
          <tr>
            <td>2026-02-06</td><td>2026-02-06</td><td>789</td><td>FONDOS</td>
            <td>ALTA IIC SWITCH</td><td>IE00B18GC888</td><td>VANGUARD GLOB BOND EUR</td>
            <td>2.09</td><td>EUR</td><td>106.7457</td><td>223.00</td>
          </tr>
        </table>
      </body></html>
    HTML
  end

  subject(:result) { described_class.parse(StringIO.new(html)) }

  it "ignores non-DIVIDENDO operations (subscriptions, switches, etc)" do
    isins = result[:dividends].map { |d| d[:isin] }
    expect(isins).to contain_exactly("IE0003UVYC20", "ES0173516115")
    expect(isins).not_to include("IE00B18GC888") # the ALTA IIC SWITCH row
  end

  it "maps each dividend row to the structured shape" do
    jpm = result[:dividends].find { |d| d[:isin] == "IE0003UVYC20" }
    expect(jpm).to include(
      isin: "IE0003UVYC20",
      currency: "EUR",
      date: Date.new(2026, 3, 19),
      quantity: 50,
      per_share_amount: BigDecimal("0.0935296"),
      amount: BigDecimal("4.68"),
      withholding_tax: BigDecimal("0")
    )
  end

  it "derives a best-effort ticker from the asset name" do
    repsol = result[:dividends].find { |d| d[:isin] == "ES0173516115" }
    expect(repsol[:ticker]).to eq("REPSOL")

    jpm = result[:dividends].find { |d| d[:isin] == "IE0003UVYC20" }
    # First word before legal/fund suffixes
    expect(jpm[:ticker]).to eq("JPM")
  end

  it "reports :es language" do
    expect(result[:language]).to eq(:es)
  end

  describe "edge cases" do
    let(:html) do
      <<~HTML
        <html><body><table>
          <tr><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th><th>x</th></tr>
          <tr>
            <td>not-a-date</td><td>2026-03-20</td><td>1</td><td>GENERICO</td>
            <td>DIVIDENDO</td><td>IE0003UVYC20</td><td>JPM</td>
            <td>50</td><td>EUR</td><td>0.09</td><td>4.50</td>
          </tr>
          <tr>
            <td>2026-03-19</td><td>2026-03-20</td><td>1</td><td>GENERICO</td>
            <td>DIVIDENDO</td><td></td><td>JPM</td>
            <td>50</td><td>EUR</td><td>0.09</td><td>4.50</td>
          </tr>
          <tr>
            <td>2026-03-19</td><td>2026-03-20</td><td>1</td><td>GENERICO</td>
            <td>DIVIDENDO</td><td>IE0003UVYC20</td><td>JPM</td>
            <td>50</td><td>EUR</td><td>0.09</td><td></td>
          </tr>
        </table></body></html>
      HTML
    end

    it "skips bad-date / missing-isin / no-amount rows and reports them" do
      reasons = result[:skipped].map { |s| s[:reason] }
      expect(reasons).to contain_exactly("bad_date", "no_isin", "no_amount")
      expect(result[:dividends]).to be_empty
    end
  end
end
