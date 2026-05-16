RSpec.describe FinancialDataProviders::BaseProvider, type: :model do
  describe '#get_stock' do
    let(:symbol) { 'AAPL' }
    let(:stock_data) { { symbol: symbol, price: 150.00 } }
    let(:stock) { build(:stock, symbol: symbol, price: 150.00) }

    context 'with caching' do
      let(:test_provider) do
        Class.new(described_class) do
          def fetch_and_normalize_stock(symbol)
            { symbol: symbol, price: 150.00 }
          end
        end.new
      end

      before do
        allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
        allow(stock).to receive(:update!).and_return(true)

        Rails.cache.clear
      end

      it 'caches the stock object and returns it directly' do
        result = test_provider.get_stock(symbol)
        expect(result.symbol).to eq(stock.symbol)
        expect(result.price).to eq(stock.price)

        # Second call should return cached stock without calling update! again
        cached_result = test_provider.get_stock(symbol)
        expect(cached_result.symbol).to eq(stock.symbol)
        expect(stock).to have_received(:update!).once
      end

      it 'normalizes symbol to uppercase' do
        test_provider.get_stock('aapl')
        expect(Stock).to have_received(:find_or_initialize_by).with(symbol: 'AAPL')
      end

      it 'stores the stock data in the database' do
        test_provider.get_stock(symbol)
        expect(stock).to have_received(:update!).with(
          hash_including(
            symbol: stock_data[:symbol],
            price: stock_data[:price],
            updated_at: be_within(1.second).of(Time.current)
          )
        )
      end
    end

    context 'with dividend schedule fields' do
      let(:provider_with_schedule) do
        Class.new(described_class) do
          def fetch_and_normalize_stock(symbol)
            {
              symbol: symbol, price: 150.00,
              ex_dividend_date: Date.new(2024, 3, 14),
              payment_frequency: "quarterly",
              payment_months: [ 3, 6, 9, 12 ],
              shifted_payment_months: []
            }
          end
        end.new
      end

      before do
        allow(Stock).to receive(:find_or_initialize_by).and_return(stock)
        allow(stock).to receive(:update!).and_return(true)
        Rails.cache.clear
      end

      it 'includes dividend schedule fields in normalized data' do
        provider_with_schedule.get_stock(symbol)
        expect(stock).to have_received(:update!).with(
          hash_including(
            ex_dividend_date: Date.new(2024, 3, 14),
            payment_frequency: "quarterly",
            payment_months: [ 3, 6, 9, 12 ],
            shifted_payment_months: []
          )
        )
      end
    end
  end

  describe '#infer_dividend_schedule' do
    let(:provider) { described_class.new }

    context 'with quarterly history (4 dividends/year)' do
      let(:history) do
        [
          { date: Date.new(2024, 2, 9), amount: 0.24 },
          { date: Date.new(2024, 5, 10), amount: 0.25 },
          { date: Date.new(2024, 8, 9), amount: 0.25 },
          { date: Date.new(2024, 11, 8), amount: 0.25 },
          { date: Date.new(2025, 2, 7), amount: 0.25 },
          { date: Date.new(2025, 5, 9), amount: 0.25 },
          { date: Date.new(2025, 8, 8), amount: 0.25 },
          { date: Date.new(2025, 11, 7), amount: 0.25 }
        ]
      end

      it 'infers quarterly frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("quarterly")
      end

      it 'extracts actual payment months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq([ 2, 5, 8, 11 ])
      end

      it 'has no shifted months for consistent history' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:shifted_payment_months]).to eq([])
      end
    end

    context 'with monthly history (12 dividends/year)' do
      let(:history) do
        (1..24).map do |i|
          { date: Date.new(2024, 1, 15) + (i - 1).months, amount: 0.25 }
        end
      end

      it 'infers monthly frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("monthly")
      end

      it 'returns all 12 months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq((1..12).to_a)
      end
    end

    context 'with semi-annual history (2 dividends/year)' do
      let(:history) do
        [
          { date: Date.new(2024, 6, 1), amount: 1.0 },
          { date: Date.new(2024, 12, 1), amount: 1.0 },
          { date: Date.new(2025, 6, 1), amount: 1.0 },
          { date: Date.new(2025, 12, 1), amount: 1.0 }
        ]
      end

      it 'infers semi_annual frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("semi_annual")
      end

      it 'extracts payment months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq([ 6, 12 ])
      end
    end

    context 'with annual history (1 dividend/year)' do
      let(:history) do
        [
          { date: Date.new(2024, 9, 1), amount: 5.0 },
          { date: Date.new(2025, 9, 1), amount: 5.0 }
        ]
      end

      it 'infers annual frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("annual")
      end
    end

    context 'with empty history' do
      it 'returns empty hash' do
        result = provider.send(:infer_dividend_schedule, [])
        expect(result).to eq({})
      end
    end

    context 'with nil history' do
      it 'returns empty hash' do
        result = provider.send(:infer_dividend_schedule, nil)
        expect(result).to eq({})
      end
    end

    context 'with month-shifting dividends (e.g. KO)' do
      let(:history) do
        [
          { date: Date.new(2024, 3, 14), amount: 0.485 },
          { date: Date.new(2024, 6, 13), amount: 0.485 },
          { date: Date.new(2024, 9, 12), amount: 0.485 },
          { date: Date.new(2024, 11, 29), amount: 0.485 },
          { date: Date.new(2025, 3, 13), amount: 0.51 },
          { date: Date.new(2025, 6, 12), amount: 0.51 },
          { date: Date.new(2025, 9, 11), amount: 0.51 },
          { date: Date.new(2025, 12, 12), amount: 0.51 }
        ]
      end

      it 'infers quarterly frequency' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_frequency]).to eq("quarterly")
      end

      it 'includes all historical months' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:payment_months]).to eq([ 3, 6, 9, 11, 12 ])
      end

      it 'marks months appearing only once as shifted' do
        result = provider.send(:infer_dividend_schedule, history)
        expect(result[:shifted_payment_months]).to eq([ 11, 12 ])
      end
    end
  end

  describe 'minor-unit currency normalization' do
    let(:gbp_provider) do
      Class.new(described_class) do
        def fetch_and_normalize_stock(_symbol)
          { symbol: 'DGE.L', price: 1529.50, currency: 'GBp',
            eps: 80.0, dividend: 60.0, ma_50: 1500.0, ma_200: 1450.0,
            fifty_two_week_high: 1800.0, fifty_two_week_low: 1200.0,
            dividend_yield: 3.92, payout_ratio: 75.0, pe_ratio: 19.0 }
        end
      end.new
    end

    before { Rails.cache.clear }

    it 'converts GBp prices to GBP and divides every monetary field by 100' do
      stock = gbp_provider.get_stock('DGE.L')
      expect(stock.currency).to eq('GBP')
      # price is stored as decimal(10, 2), so 15.295 rounds to 15.30
      expect(stock.price.to_f).to be_within(0.01).of(15.30)
      expect(stock.eps.to_f).to eq(0.8)
      expect(stock.dividend.to_f).to eq(0.6)
      expect(stock.ma_50.to_f).to eq(15.0)
      expect(stock.ma_200.to_f).to eq(14.5)
      expect(stock.fifty_two_week_high.to_f).to eq(18.0)
      expect(stock.fifty_two_week_low.to_f).to eq(12.0)
    end

    it 'leaves yield/payout/PE ratios untouched (they are unitless)' do
      stock = gbp_provider.get_stock('DGE.L')
      expect(stock.dividend_yield.to_f).to eq(3.92)
      expect(stock.payout_ratio.to_f).to eq(75.0)
      expect(stock.pe_ratio.to_f).to eq(19.0)
    end

    it 'leaves non-minor-unit currencies alone' do
      usd_provider = Class.new(described_class) do
        def fetch_and_normalize_stock(_symbol)
          { symbol: 'AAPL', price: 150.0, currency: 'USD' }
        end
      end.new
      stock = usd_provider.get_stock('AAPL')
      expect(stock.currency).to eq('USD')
      expect(stock.price.to_f).to eq(150.0)
    end
  end

  describe '#search' do
    let(:provider_class) do
      klass = Class.new(described_class) do
        attr_accessor :search_response

        def fetch_and_normalize_search(_query)
          @search_response || []
        end
      end
      stub_const('FinancialDataProviders::TestSearchProvider', klass)
      klass
    end
    let(:provider) { provider_class.new }
    let(:other_provider_class) do
      klass = Class.new(described_class) do
        def fetch_and_normalize_search(_query)
          []
        end
      end
      stub_const('FinancialDataProviders::OtherTestProvider', klass)
      klass
    end
    let(:other_provider) { other_provider_class.new }

    before { Rails.cache.clear }

    it 'returns [] for a blank query' do
      expect(provider.search('   ')).to eq([])
    end

    it 'returns [] for nil' do
      expect(provider.search(nil)).to eq([])
    end

    it 'merges DB matches with provider matches' do
      create(:stock, symbol: 'AAPL', name: 'Apple Inc.')
      provider.search_response = [
        { symbol: 'AAPLF', name: 'Apple Foreign', exchange: 'OTC', type: 'EQUITY' }
      ]
      result = provider.search('app')
      expect(result.map { |r| r[:symbol] }).to contain_exactly('AAPL', 'AAPLF')
    end

    it 'DB rows win on dedupe and carry stock_id + in_db' do
      apple = create(:stock, symbol: 'AAPL', name: 'Apple Inc.')
      provider.search_response = [
        { symbol: 'AAPL', name: 'Provider Name', exchange: 'NMS', type: 'EQUITY' }
      ]
      result = provider.search('aapl')
      aapl_row = result.find { |r| r[:symbol] == 'AAPL' }
      expect(aapl_row[:stock_id]).to eq(apple.id)
      expect(aapl_row[:in_db]).to be true
      expect(aapl_row[:name]).to eq('Apple Inc.')
    end

    it 'backfills exchange/type from the provider when the DB row has none' do
      create(:stock, symbol: 'DGE.L', name: 'Diageo plc')
      provider.search_response = [
        { symbol: 'DGE.L', name: 'Diageo plc', exchange: 'London', type: 'EQUITY' }
      ]
      result = provider.search('diageo')
      row = result.find { |r| r[:symbol] == 'DGE.L' }
      expect(row[:in_db]).to be true
      expect(row[:exchange]).to eq('London')
    end

    it 'flags provider-only rows with stock_id: nil and in_db: false' do
      provider.search_response = [
        { symbol: 'MSFT', name: 'Microsoft', exchange: 'NMS', type: 'EQUITY' }
      ]
      result = provider.search('msft')
      msft_row = result.find { |r| r[:symbol] == 'MSFT' }
      expect(msft_row[:stock_id]).to be_nil
      expect(msft_row[:in_db]).to be false
    end

    it 'caps results at 10' do
      provider.search_response = (1..15).map { |i| { symbol: "SYM#{i}", name: "Stock #{i}", type: 'EQUITY' } }
      expect(provider.search('sym').size).to eq(10)
    end

    it 'caches by provider class so two providers do not share cached results' do
      provider.search_response = [ { symbol: 'AAPL', name: 'A', type: 'EQUITY' } ]
      provider.search('aapl')
      provider.search_response = [ { symbol: 'XXX', name: 'X', type: 'EQUITY' } ]
      # Same provider — cache hit, response unchanged
      expect(provider.search('aapl').map { |r| r[:symbol] }).to eq([ 'AAPL' ])
      # Different provider — cache miss, returns []
      expect(other_provider.search('aapl')).to eq([])
    end

    it 'matches by name too' do
      create(:stock, symbol: 'KO', name: 'The Coca-Cola Company')
      provider.search_response = []
      result = provider.search('coca')
      expect(result.map { |r| r[:symbol] }).to eq([ 'KO' ])
    end

    it 'neutralizes % and _ in the query via sanitize_sql_like' do
      create(:stock, symbol: 'AAA', name: 'Triple A')
      provider.search_response = []
      # If sanitize_sql_like weren't applied, "%" would match every row.
      expect(provider.search('%')).to eq([])
    end

    it 'caches identical queries: the second call does not hit the provider' do
      provider.search_response = [ { symbol: 'AAPL', name: 'Apple', type: 'EQUITY' } ]
      provider.search('apple')
      allow(provider).to receive(:fetch_and_normalize_search).and_return(
        [ { symbol: 'NEWONE', name: 'New', type: 'EQUITY' } ]
      )
      result = provider.search('apple')
      expect(result.map { |r| r[:symbol] }).to eq([ 'AAPL' ])
      expect(provider).not_to have_received(:fetch_and_normalize_search)
    end

    it 'filters out non-searchable types (currency, crypto, index, future)' do
      provider.search_response = [
        { symbol: 'EURUSD=X', name: 'EUR/USD', type: 'CURRENCY' },
        { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTOCURRENCY' },
        { symbol: '^GSPC', name: 'S&P 500', type: 'INDEX' },
        { symbol: 'ESZ24.CME', name: 'E-mini S&P Dec 24', type: 'FUTURE' },
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY' }
      ]
      result = provider.search('mix')
      expect(result.map { |r| r[:symbol] }).to eq([ 'AAPL' ])
    end

    it 'keeps ETF and mutual fund results alongside equities' do
      provider.search_response = [
        { symbol: 'SCHD', name: 'Schwab US Dividend', type: 'ETF' },
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY' },
        # Spanish dividend funds (e.g. Baelo Dividendo Creciente) are mutual funds
        { symbol: '0P0001D6BS.F', name: 'Baelo Dividendo Creciente', type: 'MUTUALFUND' }
      ]
      result = provider.search('div')
      expect(result.map { |r| r[:symbol] }).to contain_exactly('AAPL', 'SCHD', '0P0001D6BS.F')
    end

    it 'matches type case-insensitively (Alpha Vantage uses "Equity"/"ETF")' do
      provider.search_response = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity' },
        { symbol: 'SCHD', name: 'Schwab US Dividend', type: 'etf' }
      ]
      result = provider.search('mix')
      expect(result.map { |r| r[:symbol] }).to contain_exactly('AAPL', 'SCHD')
    end

    it 'raises NotImplementedError when subclass omits fetch_and_normalize_search' do
      base = described_class.new
      expect { base.search('aapl') }.to raise_error(NotImplementedError)
    end
  end

  describe '#refresh_stocks' do
    let(:test_provider) do
      Class.new(described_class) do
        def fetch_and_normalize_stock(symbol)
          { symbol: symbol, price: 150.00 }
        end
      end.new
    end

    before do
      Rails.cache.clear
    end

    context 'when there are stocks to refresh' do
      let!(:stock_aapl) { create(:stock, symbol: 'AAPL', price: 100.00) }
      let!(:stock_msft) { create(:stock, symbol: 'MSFT', price: 200.00) }

      it 'updates all stocks and returns the count' do
        result = test_provider.refresh_stocks
        expect(result[:updated]).to eq(2)
        expect(result[:errors]).to be_empty
        expect(stock_aapl.reload.price).to eq(150.00)
        expect(stock_msft.reload.price).to eq(150.00)
      end

      it 'warms the Rails cache for each stock' do
        test_provider.refresh_stocks
        expect(Rails.cache.read("stock/AAPL")).to be_present
        expect(Rails.cache.read("stock/MSFT")).to be_present
      end
    end

    context 'when there are no stocks' do
      it 'returns zero updated and no errors' do
        result = test_provider.refresh_stocks
        expect(result).to eq({ updated: 0, errors: [] })
      end
    end

    context 'when a stock fails to refresh' do
      let!(:stock) { create(:stock, symbol: 'FAIL', price: 100.00) }

      let(:failing_provider) do
        Class.new(described_class) do
          def fetch_and_normalize_stock(symbol)
            nil
          end
        end.new
      end

      it 'adds the symbol to errors' do
        result = failing_provider.refresh_stocks
        expect(result[:updated]).to eq(0)
        expect(result[:errors]).to eq([ 'FAIL' ])
      end
    end
  end
end
