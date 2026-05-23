# Per-user daily limit on AI calls (calendar day in UTC). AI inference costs
# real money and a power user refreshing insights could spike the bill — this
# caps non-admin users at `DAILY_LIMIT` LLM hits per day across every AI-using
# surface (web insights, future Telegram bot, etc.). Admin accounts bypass.
#
# Cache hits don't count: this checks `AiRequest` rows, which are only created
# when a call actually hit the LLM. The caller is expected to probe its cache
# *before* calling `allow?`.
class AiRateLimiter
  DAILY_LIMIT = 3

  Result = Struct.new(:allowed, :remaining, :limit, :reset_at, :admin_bypass, keyword_init: true) do
    def allowed? = allowed
  end

  def self.allow?(user, _feature)
    return Result.new(allowed: true, remaining: nil, limit: nil, reset_at: nil, admin_bypass: true) if user&.admin?

    used = AiRequest.today_for(user).count
    remaining = [ DAILY_LIMIT - used, 0 ].max
    Result.new(
      allowed: used < DAILY_LIMIT,
      remaining: remaining,
      limit: DAILY_LIMIT,
      reset_at: Time.current.utc.tomorrow.beginning_of_day,
      admin_bypass: false
    )
  end

  def self.record!(user:, feature:, provider:)
    AiRequest.create!(user: user, feature: feature, provider: provider.to_s)
  end
end
