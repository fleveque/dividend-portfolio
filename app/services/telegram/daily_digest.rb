module Telegram
  # Composes one user's daily digest message. Returns the rendered HTML
  # string ready for `TelegramBot::Client.send_message`, or `nil` if all
  # three sections are empty (don't send "nothing today" noise).
  #
  # Sections, in order:
  #   1. Upcoming ex-divs (next 7 days) — held first, then radar-only
  #   2. Dividends received yesterday — total + per-stock breakdown
  #   3. Target-price hits — radar stocks below target, throttled by
  #      `notified_below_target_at` so we don't spam if a stock sits
  #      below target for weeks. We mutate radar_stocks here to record
  #      the alert timestamp (and reset it when stocks climb back above).
  class DailyDigest
    EX_DIV_WINDOW = 7.days
    ALERT_THROTTLE = 7.days

    def self.build(user:, locale: "en")
      new(user: user, locale: locale).build
    end

    def initialize(user:, locale: "en")
      @user = user
      @locale = locale
    end

    def build
      sections = [ ex_divs_section, received_section, target_hits_section ].compact
      return nil if sections.empty?

      [
        t("digest.greeting"),
        *sections,
        t("digest.footer")
      ].join("\n\n")
    end

    private

    attr_reader :user, :locale

    def ex_divs_section
      today = Date.current
      cutoff = today + EX_DIV_WINDOW

      held_ids = user.holdings.pluck(:stock_id).to_set
      radar_ids = user.radar&.radar_stocks&.pluck(:stock_id) || []
      candidate_ids = (held_ids.to_a + radar_ids).uniq
      return nil if candidate_ids.empty?

      stocks = Stock.where(id: candidate_ids).where(ex_dividend_date: today..cutoff).order(:ex_dividend_date)
      return nil if stocks.empty?

      # Held stocks first (more actionable: actual money), then radar-only.
      held_stocks, radar_only = stocks.partition { |s| held_ids.include?(s.id) }
      held_quantities = user.holdings.where(stock_id: held_stocks.map(&:id)).pluck(:stock_id, :quantity).to_h

      lines = [ t("digest.ex_divs.header") ]
      held_stocks.each do |stock|
        per_payment = (stock.dividend.to_f / dividends_per_year(stock))
        amount = (per_payment * held_quantities[stock.id].to_f).round(2)
        lines << t("digest.ex_divs.line_held",
          symbol: esc(stock.symbol),
          date: stock.ex_dividend_date.iso8601,
          amount: amount,
          currency: esc(stock.currency))
      end
      radar_only.each do |stock|
        lines << t("digest.ex_divs.line_radar",
          symbol: esc(stock.symbol),
          date: stock.ex_dividend_date.iso8601)
      end

      lines.join("\n")
    end

    def received_section
      yesterday = Date.current - 1.day
      dividends = user.dividends.includes(:stock).where(date: yesterday).order(:stock_id)
      return nil if dividends.empty?

      by_currency = dividends.group_by(&:currency)
      blocks = by_currency.map do |currency, rows|
        net_total = rows.sum { |d| d.amount.to_f - d.withholding_tax.to_f }.round(2)
        per_line = rows.map do |d|
          net = (d.amount.to_f - d.withholding_tax.to_f).round(2)
          t("digest.dividends_received.line",
            symbol: esc(d.stock.symbol),
            amount: net,
            currency: esc(d.currency))
        end
        ([
          t("digest.dividends_received.total", amount: net_total, currency: esc(currency))
        ] + per_line).join("\n")
      end

      ([ t("digest.dividends_received.header") ] + blocks).join("\n")
    end

    # Per-RadarStock: if currently below target AND
    # (notified_below_target_at IS NULL OR > ALERT_THROTTLE ago), include
    # and bump the timestamp. When a stock crosses back above target, clear
    # the timestamp so the next dip re-triggers.
    def target_hits_section
      radar = user.radar
      return nil unless radar

      hits = []
      throttle_cutoff = ALERT_THROTTLE.ago

      radar.radar_stocks.includes(:stock).each do |rs|
        next unless rs.target_price && rs.stock.price
        below = rs.stock.price.to_f < rs.target_price.to_f

        unless below
          # Reset throttle when the stock climbs back above target so the
          # next dip is fresh news.
          rs.update_columns(notified_below_target_at: nil) if rs.notified_below_target_at.present?
          next
        end

        last = rs.notified_below_target_at
        next if last.present? && last > throttle_cutoff

        rs.update_columns(notified_below_target_at: Time.current)
        percent_below = ((rs.target_price.to_f - rs.stock.price.to_f) / rs.target_price.to_f * 100).round(1)
        hits << {
          symbol: rs.stock.symbol,
          price: rs.stock.price.to_f.round(2),
          target: rs.target_price.to_f.round(2),
          currency: rs.stock.currency,
          percent_below: percent_below
        }
      end

      return nil if hits.empty?

      lines = [ t("digest.target_hits.header") ]
      hits.each do |h|
        lines << t("digest.target_hits.line",
          symbol: esc(h[:symbol]),
          price: h[:price],
          target: h[:target],
          currency: esc(h[:currency]),
          percent: "-#{h[:percent_below]}%")
      end
      lines.join("\n")
    end

    def dividends_per_year(stock)
      case stock.payment_frequency
      when "monthly" then 12
      when "semi_annual" then 2
      when "annual" then 1
      else 4
      end
    end

    def esc(text)
      TelegramBot::Client.escape_html(text)
    end

    def t(key, **args)
      TelegramBot::Copy.t(key, locale: locale, **args)
    end
  end
end
