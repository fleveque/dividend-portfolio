module Api
  module V1
    class BuyPlansController < BaseController
      before_action :set_or_create_buy_plan, only: [ :show, :save, :destroy ]

      # GET /api/v1/buy_plan
      # Returns the user's buy plan with all items
      def show
        render_success(serialize_buy_plan(@buy_plan))
      end

      # POST /api/v1/buy_plan/save
      # Creates/updates the entire cart from frontend
      def save
        items_params = params.permit(items: [ :stockId, :quantity ]).fetch(:items, [])

        ActiveRecord::Base.transaction do
          # Clear existing items
          @buy_plan.buy_plan_items.destroy_all

          # Create new items
          items_params.each do |item|
            stock = Stock.find(item[:stockId])
            @buy_plan.buy_plan_items.create!(
              stock: stock,
              quantity: item[:quantity].to_i
            )
          end
        end

        render_success(serialize_buy_plan(@buy_plan.reload))
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.message)
      end

      # DELETE /api/v1/buy_plan
      # Deletes the buy plan and all items
      def destroy
        @buy_plan.buy_plan_items.destroy_all
        render_success({ reset: true })
      end

      private

      def set_or_create_buy_plan
        @buy_plan = Current.user.buy_plan || Current.user.create_buy_plan
      end

      def serialize_buy_plan(buy_plan)
        items = buy_plan.buy_plan_items.includes(:stock).map { |item| serialize_item(item) }
        total_items = items.sum { |i| i[:quantity] }
        totals = Hash.new(0.0)
        items.each { |i| totals[i[:currency]] += i[:subtotal] if i[:subtotal] }
        totals_by_currency = totals.transform_values(&:to_f)

        {
          id: buy_plan.id,
          items: items,
          totalItems: total_items,
          totalsByCurrency: totals_by_currency,
          displayTotal: cart_display_total(totals_by_currency)
        }
      end

      def cart_display_total(totals_by_currency)
        preferred = Current.user.preferred_currency
        conversions = {}
        total = 0.0

        totals_by_currency.each do |currency, amount|
          if currency == preferred
            total += amount
            next
          end

          rate = FxRateService.rate(from: currency, to: preferred)
          return nil unless rate

          conversions[currency] = rate
          total += amount * rate
        end

        { currency: preferred, total: total.to_f, conversions: conversions }
      end

      def serialize_item(item)
        stock = item.stock
        subtotal = stock.price ? stock.price * item.quantity : nil
        decorated = StockDecorator.new(stock)

        {
          stockId: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          currency: stock.currency,
          quantity: item.quantity,
          currentPrice: stock.price&.to_f,
          formattedPrice: stock.price ? decorated.format_currency(stock.price) : "N/A",
          subtotal: subtotal&.to_f,
          formattedSubtotal: subtotal ? decorated.format_currency(subtotal) : "N/A"
        }
      end
    end
  end
end
