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
            activity: activity_payload,
            ai: ai_payload,
            telegram: telegram_payload
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

        # AI cost / usage observability. We don't have separate logging for
        # cache hits or denials, so:
        #   - `callsToday|7d|30d` count actual LLM hits (AiRequest rows).
        #   - `usersAtQuotaToday` counts users whose today-count equals the
        #     daily limit (≈ "users that bumped into the cap today").
        # `byProvider` is a placeholder bucket — only `gemini` populates it
        # today, but the provider column is there for the day we add a
        # second adapter.
        def ai_payload
          {
            callsToday: AiRequest.where("created_at >= ?", Time.current.utc.beginning_of_day).count,
            callsLast7d: AiRequest.where("created_at >= ?", 7.days.ago).count,
            callsLast30d: AiRequest.where("created_at >= ?", 30.days.ago).count,
            byFeature: AiRequest.where("created_at >= ?", 30.days.ago).group(:feature).count,
            byProvider: AiRequest.where("created_at >= ?", 30.days.ago).group(:provider).count,
            topUsers: top_ai_users(30),
            usersAtQuotaToday: users_at_quota_today,
            dailyLimit: AiRateLimiter::DAILY_LIMIT
          }
        end

        def telegram_payload
          linked = UserTelegramLink.linked
          {
            linkedUsers: linked.count,
            linkedLast7d: linked.where("linked_at >= ?", 7.days.ago).count,
            linkedLast30d: linked.where("linked_at >= ?", 30.days.ago).count,
            notificationsEnabled: linked.where(notifications_enabled: true).count,
            botQuestionsLast7d: AiRequest.where(feature: "telegram_chat").where("created_at >= ?", 7.days.ago).count,
            botQuestionsLast30d: AiRequest.where(feature: "telegram_chat").where("created_at >= ?", 30.days.ago).count,
            topBotUsers: top_bot_users(30)
          }
        end

        TOP_USERS_LIMIT = 10

        def top_ai_users(days)
          counts = AiRequest.where("created_at >= ?", days.days.ago).group(:user_id).count
          serialize_top_users(counts)
        end

        def top_bot_users(days)
          counts = AiRequest.where(feature: "telegram_chat")
                            .where("created_at >= ?", days.days.ago)
                            .group(:user_id).count
          serialize_top_users(counts)
        end

        def serialize_top_users(counts_by_user_id)
          top_ids = counts_by_user_id.sort_by { |_, c| -c }.first(TOP_USERS_LIMIT).to_h
          emails_by_id = User.where(id: top_ids.keys).pluck(:id, :email_address).to_h
          top_ids.map do |user_id, count|
            { email: emails_by_id[user_id] || "(deleted)", count: count }
          end
        end

        # Number of users who have already hit the daily AI cap today.
        # A user is "at quota" when today's actual call count equals the
        # rate-limiter's DAILY_LIMIT. Admins are excluded — they bypass the
        # limiter (see AiRateLimiter#allow?).
        def users_at_quota_today
          counts = AiRequest.where("created_at >= ?", Time.current.utc.beginning_of_day)
                            .group(:user_id).count
          at_quota_ids = counts.select { |_, c| c >= AiRateLimiter::DAILY_LIMIT }.keys
          return 0 if at_quota_ids.empty?
          User.where(id: at_quota_ids, admin: false).count
        end
      end
    end
  end
end
