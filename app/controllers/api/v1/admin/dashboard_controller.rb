module Api
  module V1
    module Admin
      class DashboardController < BaseController
        # GET /api/v1/admin/dashboard
        def show
          render_success({
            users: {
              total: User.count,
              admins: User.where(admin: true).count,
              recentSignups: User.where("created_at >= ?", 30.days.ago).count
            },
            stocks: {
              total: Stock.count,
              withPrice: Stock.where.not(price: nil).count,
              withoutPrice: Stock.where(price: nil).count
            },
            radars: {
              total: Radar.count,
              totalStocksTracked: RadarStock.count,
              avgStocksPerRadar: Radar.count.positive? ? (RadarStock.count.to_f / Radar.count).round(1) : 0
            },
            buyPlans: {
              total: BuyPlan.count,
              totalItems: BuyPlanItem.count
            },
            transactions: {
              total: Transaction.count
            }
          })
        end
      end
    end
  end
end
