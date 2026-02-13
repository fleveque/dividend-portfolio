module Api
  module V1
    # API endpoints for the user's radar (watchlist).
    # All endpoints require authentication.
    class RadarsController < BaseController
      before_action :set_or_create_radar
      before_action :set_service, only: [ :add_stock, :remove_stock, :update_target_price ]

      # GET /api/v1/radar
      # Returns the user's radar with all stocks and their target prices
      def show
        stocks = @radar.sorted_stocks || []
        render_success({
          id: @radar.id,
          stocks: stocks.map { |s| serialize_radar_stock(s) }
        })
      end

      # POST /api/v1/radar/stocks/:stock_id
      # Adds a stock to the user's radar
      def add_stock
        stock = Stock.find(params[:stock_id])
        result = @service.add_stock(stock, target_price: params[:target_price])

        if result.success?
          render_success(serialize_radar_stock_from_result(stock, result.data), status: :created)
        else
          render_error(result.error)
        end
      end

      # DELETE /api/v1/radar/stocks/:stock_id
      # Removes a stock from the user's radar
      def remove_stock
        stock = Stock.find(params[:stock_id])
        @service.remove_stock(stock)
        render_success({ removed: true })
      end

      # PATCH /api/v1/radar/stocks/:stock_id/target_price
      # Updates the target price for a stock on the radar
      def update_target_price
        stock = Stock.find(params[:stock_id])
        result = @service.update_target_price(stock, params[:target_price])

        if result.success?
          render_success(serialize_radar_stock_from_result(stock, result.data))
        else
          render_error(result.error)
        end
      end

      private

      def set_or_create_radar
        @radar = Current.user.radar || Current.user.create_radar
      end

      def set_service
        @service = StockRadarService.new(@radar)
      end

      # Serialize a stock from the radar (includes target_price from join table)
      def serialize_radar_stock(stock)
        decorated = StockDecorator.new(stock, target_price: stock.target_price)

        {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          formattedPrice: decorated.formatted_price,
          targetPrice: stock.target_price,
          formattedTargetPrice: decorated.formatted_target_price,
          priceStatusClass: decorated.price_status_class,
          percentageDifference: decorated.formatted_percentage_difference,
          aboveTarget: decorated.above_target?,
          belowTarget: decorated.below_target?,
          atTarget: decorated.at_target?,
          **serialize_stock_metrics(stock, decorated)
        }
      end

      # Serialize after a create/update operation (radar_stock is the join record)
      def serialize_radar_stock_from_result(stock, radar_stock)
        decorated = StockDecorator.new(stock, target_price: radar_stock.target_price)

        {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          formattedPrice: decorated.formatted_price,
          targetPrice: radar_stock.target_price,
          formattedTargetPrice: decorated.formatted_target_price,
          priceStatusClass: decorated.price_status_class,
          percentageDifference: decorated.formatted_percentage_difference,
          aboveTarget: decorated.above_target?,
          belowTarget: decorated.below_target?,
          atTarget: decorated.at_target?,
          **serialize_stock_metrics(stock, decorated)
        }
      end

      # Serialize extended stock metrics
      def serialize_stock_metrics(stock, decorated)
        {
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
