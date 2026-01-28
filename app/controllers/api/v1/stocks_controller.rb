module Api
  module V1
    # API endpoints for stock data.
    # These endpoints are public (no authentication required).
    class StocksController < BaseController
      # Public endpoints don't require login
      allow_unauthenticated_access

      # GET /api/v1/stocks
      # Returns all stocks (paginated in a real app)
      def index
        stocks = Stock.all.limit(50)
        render_success(stocks.map { |s| serialize_stock(s) })
      end

      # GET /api/v1/stocks/:id
      # Returns a single stock by ID
      def show
        stock = Stock.find(params[:id])
        render_success(serialize_stock(stock))
      end

      # GET /api/v1/stocks/last_added
      # Returns the most recently added stocks
      def last_added
        stocks = Rails.cache.fetch("last_added_stocks", expires_in: 1.hour) do
          Stock.last_added(10)
        end
        render_success(stocks.map { |s| serialize_stock(s) })
      end

      # GET /api/v1/stocks/most_added
      # Returns stocks most frequently added to radars
      def most_added
        stocks = Rails.cache.fetch("most_added_stocks", expires_in: 1.hour) do
          Radar.most_added_stocks(10)
        end
        render_success(stocks.map { |s| serialize_stock(s) })
      end

      # GET /api/v1/stocks/search?query=AAPL
      # Searches for a stock by symbol using the financial data provider
      def search
        return render_success([]) if params[:query].blank?

        result = FinancialDataService.get_stock(params[:query])
        if result.is_a?(Stock)
          render_success([ serialize_stock(result) ])
        else
          render_success([])
        end
      rescue StandardError => e
        # Log the error but return empty results to the user
        # This handles cases where the financial provider fails or returns invalid data
        Rails.logger.warn "Stock search failed for '#{params[:query]}': #{e.message}"
        render_success([])
      end

      private

      # Serialize a stock to a JSON-friendly hash.
      # This matches the Stock interface in our TypeScript types.
      def serialize_stock(stock)
        {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          formattedPrice: format_price(stock.price)
        }
      end

      def format_price(price)
        price ? "$#{sprintf('%.2f', price)}" : "N/A"
      end
    end
  end
end
