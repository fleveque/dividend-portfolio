module Api
  module V1
    module Admin
      class DashboardController < BaseController
        SESSION_TREND_WEEKS = 8

        # GET /api/v1/admin/dashboard
        def show
          users_with_holdings = User.joins(:holdings).distinct.count
          users_with_slug = User.where.not(portfolio_slug: [ nil, "" ]).count
          total_holdings = Holding.count

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
            },
            holdings: {
              totalHoldings: total_holdings,
              usersWithHoldings: users_with_holdings,
              avgHoldingsPerUser: users_with_holdings.positive? ? (total_holdings.to_f / users_with_holdings).round(1) : 0
            },
            pulse: {
              usersWithSlug: users_with_slug,
              adoptionRate: User.count.positive? ? (users_with_slug.to_f / User.count * 100).round(1) : 0
            },
            activity: activity_payload
          })
        end

        private

        def activity_payload
          {
            activeUsers7d: active_users_in(7),
            activeUsers30d: active_users_in(30),
            holdingChanges7d: holding_changes_in(7),
            holdingChanges30d: holding_changes_in(30),
            usersTouchingHoldings7d: users_touching_holdings_in(7),
            sessionTrend: session_trend
          }
        end

        def active_users_in(days)
          Session.where("updated_at > ?", days.days.ago).distinct.count(:user_id)
        end

        def holding_changes_in(days)
          Holding.where("updated_at > ? OR created_at > ?", days.days.ago, days.days.ago).count
        end

        def users_touching_holdings_in(days)
          Holding.where("updated_at > ? OR created_at > ?", days.days.ago, days.days.ago).distinct.count(:user_id)
        end

        # Weekly buckets of session creations for the last N weeks. Returns an
        # ordered array of { weekStart: "2026-05-11", count: Integer } — week
        # starts on Monday (ISO week convention).
        def session_trend
          window_start = SESSION_TREND_WEEKS.weeks.ago.beginning_of_week
          counts = Session.where("created_at >= ?", window_start)
                          .group_by { |s| s.created_at.to_date.beginning_of_week }
                          .transform_values(&:size)

          (0...SESSION_TREND_WEEKS).map do |i|
            week_start = (window_start + i.weeks).to_date
            { weekStart: week_start.iso8601, count: counts[week_start] || 0 }
          end
        end
      end
    end
  end
end
