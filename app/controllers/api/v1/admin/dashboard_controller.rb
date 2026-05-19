module Api
  module V1
    module Admin
      class DashboardController < BaseController
        ACTIVITY_TREND_WEEKS = 8

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
            holdings: {
              totalHoldings: total_holdings,
              usersWithHoldings: users_with_holdings,
              avgHoldingsPerUser: users_with_holdings.positive? ? (total_holdings.to_f / users_with_holdings).round(1) : 0
            },
            dividends: dividends_payload,
            pulse: {
              usersWithSlug: users_with_slug,
              adoptionRate: User.count.positive? ? (users_with_slug.to_f / User.count * 100).round(1) : 0
            },
            activity: activity_payload
          })
        end

        private

        # Adoption signals for the Dividends feature — distinct user counts
        # tell us whether anyone is using it; row counts how heavily.
        def dividends_payload
          total_users = User.count
          users_with_any = Dividend.distinct.count(:user_id)
          users_importing = Dividend.imported.distinct.count(:user_id)

          {
            usersWithAny: users_with_any,
            usersImporting: users_importing,
            usersManualOnly: users_with_any - users_importing,
            adoptionRate: total_users.positive? ? (users_with_any.to_f / total_users * 100).round(1) : 0,
            totalRecords: Dividend.count,
            importedRecords: Dividend.imported.count,
            manualRecords: Dividend.manual.count
          }
        end

        def activity_payload
          {
            activeUsers7d: active_users_in(7),
            activeUsers30d: active_users_in(30),
            holdingChanges7d: holding_changes_in(7),
            holdingChanges30d: holding_changes_in(30),
            usersTouchingHoldings7d: users_touching_holdings_in(7),
            activeUsersTrend: active_users_trend
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

        # Weekly buckets of *distinct active users* — sessions whose updated_at
        # falls in each week. Rails 8 cookie sessions persist for weeks, so
        # `created_at` is near-zero by design; touching `updated_at` is the
        # real heartbeat. Returns the last N weeks ending with the current
        # week (Monday-based, ISO week convention).
        def active_users_trend
          first_week_start = Date.current.beginning_of_week - (ACTIVITY_TREND_WEEKS - 1).weeks

          weekly = Session.where("updated_at >= ?", first_week_start)
                          .group_by { |s| s.updated_at.to_date.beginning_of_week }
                          .transform_values { |sessions| sessions.map(&:user_id).uniq.size }

          (0...ACTIVITY_TREND_WEEKS).map do |i|
            week_start = first_week_start + i.weeks
            { weekStart: week_start.iso8601, count: weekly[week_start] || 0 }
          end
        end
      end
    end
  end
end
