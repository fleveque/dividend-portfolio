require "rails_helper"

RSpec.describe DividendImporters::Dispatcher do
  describe ".parse" do
    context "with IBKR-shaped content (CSV starting with section header)" do
      let(:csv) do
        <<~CSV
          Statement,Header,Field,Value
          Dividends,Header,Currency,Date,Description,Amount
          Dividends,Data,USD,2025-01-02,NKE(US6541061031) Cash Dividend USD 0.40 per share,2.8
        CSV
      end

      it "detects IBKR and includes source:'ibkr'" do
        result = described_class.parse(StringIO.new(csv))
        expect(result[:source]).to eq("ibkr")
        expect(result[:dividends].size).to eq(1)
      end
    end

    context "with MyInvestor-shaped content (HTML-as-XLS table)" do
      let(:html) do
        <<~HTML
          <html><body><table>
            <tr><th>Op</th><th>Liq</th><th>Op#</th><th>M</th><th>Op</th><th>ISIN</th><th>V</th><th>Q</th><th>C</th><th>P</th><th>A</th></tr>
            <tr><td>2026-03-19</td><td>2026-03-20</td><td>1</td><td>GENERICO</td>
                <td>DIVIDENDO</td><td>IE0003UVYC20</td><td>JPM</td>
                <td>50</td><td>EUR</td><td>0.09</td><td>4.68</td></tr>
          </table></body></html>
        HTML
      end

      it "detects MyInvestor and includes source:'myinvestor'" do
        result = described_class.parse(StringIO.new(html))
        expect(result[:source]).to eq("myinvestor")
        expect(result[:dividends].size).to eq(1)
      end
    end

  end
end
