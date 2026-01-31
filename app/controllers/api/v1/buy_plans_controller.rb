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
        total_cost = items.sum { |i| i[:subtotal] || 0 }

        {
          id: buy_plan.id,
          items: items,
          totalItems: total_items,
          totalEstimatedCost: total_cost.to_f,
          formattedTotal: format_currency(total_cost)
        }
      end

      def serialize_item(item)
        stock = item.stock
        subtotal = stock.price ? stock.price * item.quantity : nil

        {
          stockId: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          quantity: item.quantity,
          currentPrice: stock.price&.to_f,
          formattedPrice: stock.price ? format_currency(stock.price) : "N/A",
          subtotal: subtotal&.to_f,
          formattedSubtotal: subtotal ? format_currency(subtotal) : "N/A"
        }
      end

      def format_currency(value)
        "$#{sprintf('%.2f', value).reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
      end
    end
  end
end
