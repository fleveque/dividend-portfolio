module Api
  module V1
    # API endpoints for stock data.
    # These endpoints are public (no authentication required).
    class StocksController < BaseController
      # Public endpoints don't require login
      allow_unauthenticated_access
      before_action :require_authentication, only: [ :ai_summary ]

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

      # GET /api/v1/stocks/top_scored
      # Returns stocks with the highest dividend scores
      def top_scored
        stocks = Rails.cache.fetch("top_scored_stocks", expires_in: 1.hour) do
          Stock.top_scored(10)
        end
        render_success(stocks.map { |s| serialize_stock(s) })
      end

      # GET /api/v1/stocks/:id/ai_summary
      # Returns an AI-generated summary for a single stock (authenticated)
      def ai_summary
        stock = Stock.find(params[:id])
        decorated = StockDecorator.new(stock)

        # Include target price if user has this stock on their radar
        radar_stock = Current.user.radar&.radar_stocks&.find_by(stock_id: stock.id)
        target_price = radar_stock&.target_price&.to_f

        stock_data = {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price&.to_f,
          targetPrice: target_price,
          dividendYield: stock.dividend_yield&.to_f,
          payoutRatio: stock.payout_ratio&.to_f,
          peRatio: stock.pe_ratio&.to_f,
          ma200: stock.ma_200&.to_f,
          dividendScore: decorated.dividend_score,
          paymentMonths: decorated.payment_months,
          fiftyTwoWeekRangePosition: decorated.fifty_two_week_range_position,
          updated_at: stock.updated_at.to_i
        }

        result = AiInsightsService.stock_summary(stock_data)
        render_success(result)
      rescue AiProviders::BaseProvider::AiError => e
        Rails.logger.error "AI summary error for stock #{params[:id]}: #{e.message}"
        render_error("AI summary temporarily unavailable", status: :service_unavailable)
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

      def serialize_stock(stock)
        decorated = StockDecorator.new(stock)

        {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          formattedPrice: decorated.formatted_price,
          eps: stock.eps,
          peRatio: stock.pe_ratio,
          dividend: stock.dividend,
          dividendYield: stock.dividend_yield,
          payoutRatio: stock.payout_ratio,
          ma50: stock.ma_50,
          ma200: stock.ma_200,
          formattedEps: decorated.formatted_eps,
          formattedPeRatio: decorated.formatted_pe_ratio,
          formattedDividend: decorated.formatted_dividend,
          formattedDividendYield: decorated.formatted_dividend_yield,
          formattedPayoutRatio: decorated.formatted_payout_ratio,
          formattedMa50: decorated.formatted_ma_50,
          formattedMa200: decorated.formatted_ma_200,
          exDividendDate: stock.ex_dividend_date&.iso8601,
          paymentFrequency: stock.payment_frequency,
          paymentMonths: decorated.payment_months,
          shiftedPaymentMonths: decorated.shifted_payment_months,
          dividendPerPayment: decorated.dividend_per_payment,
          formattedDividendPerPayment: decorated.formatted_dividend_per_payment,
          formattedPaymentFrequency: decorated.formatted_payment_frequency,
          formattedExDividendDate: decorated.formatted_ex_dividend_date,
          dividendScheduleAvailable: decorated.dividend_schedule_available?,
          dividendScore: decorated.dividend_score,
          dividendScoreLabel: decorated.dividend_score_label,
          fiftyTwoWeekHigh: stock.fifty_two_week_high,
          fiftyTwoWeekLow: stock.fifty_two_week_low,
          formattedFiftyTwoWeekHigh: decorated.formatted_fifty_two_week_high,
          formattedFiftyTwoWeekLow: decorated.formatted_fifty_two_week_low,
          fiftyTwoWeekRangePosition: decorated.fifty_two_week_range_position,
          fiftyTwoWeekDataAvailable: decorated.fifty_two_week_data_available?
        }
      end
    end
  end
end
