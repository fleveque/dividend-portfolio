module Api
  module V1
    class HoldingsController < BaseController
      before_action :set_holding, only: [ :update, :destroy ]

      # GET /api/v1/holdings
      def index
        holdings = Current.user.holdings.includes(:stock)

        total_value = 0.0
        total_cost = 0.0

        serialized = holdings.map do |holding|
          market_value = (holding.stock.price || 0) * holding.quantity
          cost = holding.average_price * holding.quantity
          gain_loss = market_value - cost
          gain_loss_percent = cost > 0 ? (gain_loss / cost * 100) : 0

          total_value += market_value
          total_cost += cost

          serialize_holding_with_stock(holding, market_value, gain_loss, gain_loss_percent)
        end

        render_success({
          holdings: serialized,
          totalValue: total_value.to_f,
          totalCost: total_cost.to_f,
          totalGainLoss: (total_value - total_cost).to_f,
          totalGainLossPercent: total_cost > 0 ? ((total_value - total_cost) / total_cost * 100).to_f : 0.0
        })
      end

      # POST /api/v1/holdings
      def create
        existing = Current.user.holdings.find_by(stock_id: params[:stock_id])

        if existing
          merge_into_holding(existing, params[:quantity].to_f, params[:average_price].to_f)
        else
          holding = Current.user.holdings.build(holding_params)
          if holding.save
            render_success(serialize_holding(holding), status: :created)
          else
            render_error(holding.errors.full_messages.join(", "))
          end
        end
      end

      # POST /api/v1/holdings/import_from_cart
      def import_from_cart
        items = params[:items].presence || []
        return render_error("No items provided") if items.blank?

        imported = []
        items.each do |item|
          stock = Stock.find_by(id: item[:stock_id])
          next unless stock

          quantity = item[:quantity].to_f
          next unless quantity > 0

          average_price = stock.price&.to_f || 0

          existing = Current.user.holdings.find_by(stock_id: stock.id)
          if existing
            new_qty = existing.quantity + quantity
            new_avg = (existing.quantity * existing.average_price + quantity * average_price) / new_qty
            existing.update!(quantity: new_qty, average_price: new_avg)
            imported << existing
          else
            holding = Current.user.holdings.create!(stock: stock, quantity: quantity, average_price: average_price)
            imported << holding
          end
        end

        render_success({ imported: imported.size })
      end

      # PATCH /api/v1/holdings/:id
      def update
        if @holding.update(holding_params)
          render_success(serialize_holding(@holding))
        else
          render_error(@holding.errors.full_messages.join(", "))
        end
      end

      # DELETE /api/v1/holdings/:id
      def destroy
        @holding.destroy!
        render_success({ deleted: true })
      end

      # GET /api/v1/holdings/insights
      def insights
        holdings = Current.user.holdings.includes(:stock)
        stocks_data = holdings.map { |h| serialize_stock_for_ai(h.stock) }
        result = AiInsightsService.portfolio_insights(stocks_data)
        render_success(result)
      rescue AiProviders::BaseProvider::AiError => e
        Rails.logger.error "AI portfolio insights error: #{e.message}"
        render_error("AI insights temporarily unavailable", status: :service_unavailable)
      end

      private

      def set_holding
        @holding = Current.user.holdings.find(params[:id])
      end

      def holding_params
        params.require(:holding).permit(:stock_id, :quantity, :average_price)
      end

      def merge_into_holding(existing, added_qty, added_avg)
        return render_error("Quantity must be greater than 0") unless added_qty > 0

        new_qty = existing.quantity + added_qty
        new_avg = (existing.quantity * existing.average_price + added_qty * added_avg) / new_qty

        if existing.update(quantity: new_qty, average_price: new_avg)
          render_success(serialize_holding(existing))
        else
          render_error(existing.errors.full_messages.join(", "))
        end
      end

      def serialize_holding(holding)
        holding.reload
        market_value = (holding.stock.price || 0) * holding.quantity
        cost = holding.average_price * holding.quantity
        gain_loss = market_value - cost

        {
          id: holding.id,
          stockId: holding.stock_id,
          symbol: holding.stock.symbol,
          name: holding.stock.name,
          quantity: holding.quantity.to_f,
          averagePrice: holding.average_price.to_f,
          currentPrice: (holding.stock.price || 0).to_f,
          marketValue: market_value.to_f,
          gainLoss: gain_loss.to_f,
          gainLossPercent: cost > 0 ? (gain_loss / cost * 100).to_f : 0.0
        }
      end

      def serialize_holding_with_stock(holding, market_value, gain_loss, gain_loss_percent)
        decorated = StockDecorator.new(holding.stock)

        {
          id: holding.id,
          quantity: holding.quantity.to_f,
          averagePrice: holding.average_price.to_f,
          marketValue: market_value.to_f,
          gainLoss: gain_loss.to_f,
          gainLossPercent: gain_loss_percent.to_f,
          stock: serialize_stock(holding.stock, decorated)
        }
      end

      def serialize_stock(stock, decorated)
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

      def serialize_stock_for_ai(stock)
        decorated = StockDecorator.new(stock)
        {
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price&.to_f,
          dividendYield: stock.dividend_yield&.to_f,
          payoutRatio: stock.payout_ratio&.to_f,
          peRatio: stock.pe_ratio&.to_f,
          ma200: stock.ma_200&.to_f,
          dividendScore: decorated.dividend_score,
          paymentMonths: decorated.payment_months,
          fiftyTwoWeekRangePosition: decorated.fifty_two_week_range_position
        }
      end
    end
  end
end
