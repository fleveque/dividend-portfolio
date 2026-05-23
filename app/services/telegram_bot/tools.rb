module TelegramBot
  # Registry: produces the full set of `AiProviders::Tool` instances scoped
  # to a given user. Each tool's handler closes over `user` so the LLM can
  # only ever touch that user's own data.
  module Tools
    module_function

    def all_for(user)
      [
        get_radar(user),
        get_holdings(user),
        get_dividend_summary(user),
        get_recent_dividends(user),
        get_upcoming_ex_divs(user),
        get_stock(user)
      ]
    end

    def get_radar(user)
      AiProviders::Tool.new(
        name: "get_radar",
        description: "Get the user's stock radar (watchlist) with current price, target price, and whether each stock is above/below target.",
        parameters: { type: "object", properties: {}, required: [] },
        handler: ->(**) { GetRadar.call(user: user) }
      )
    end

    def get_holdings(user)
      AiProviders::Tool.new(
        name: "get_holdings",
        description: "Get the user's portfolio holdings (owned positions) with quantity, average price, market value, and P&L.",
        parameters: { type: "object", properties: {}, required: [] },
        handler: ->(**) { GetHoldings.call(user: user) }
      )
    end

    def get_dividend_summary(user)
      AiProviders::Tool.new(
        name: "get_dividend_summary",
        description: "Sum of dividends received in a period, grouped by currency. Period must be one of: this_month, last_month, ytd, last_12_months.",
        parameters: {
          type: "object",
          properties: {
            period: { type: "string", enum: %w[this_month last_month ytd last_12_months] }
          },
          required: [ "period" ]
        },
        handler: ->(period: "this_month", **) { GetDividendSummary.call(user: user, period: period) }
      )
    end

    def get_recent_dividends(user)
      AiProviders::Tool.new(
        name: "get_recent_dividends",
        description: "List the user's most recent dividend payments. Useful for 'what dividends did I get last week?' type questions.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "integer", description: "How many recent payments to return (default 10, max 25)." }
          },
          required: []
        },
        handler: ->(limit: 10, **) { GetRecentDividends.call(user: user, limit: limit.to_i) }
      )
    end

    def get_upcoming_ex_divs(user)
      AiProviders::Tool.new(
        name: "get_upcoming_ex_divs",
        description: "Stocks (held + on radar) with an ex-dividend date in the next N days.",
        parameters: {
          type: "object",
          properties: {
            days: { type: "integer", description: "Window in days (default 7, max 60)." }
          },
          required: []
        },
        handler: ->(days: 7, **) { GetUpcomingExDivs.call(user: user, days: days.to_i) }
      )
    end

    def get_stock(_user)
      AiProviders::Tool.new(
        name: "get_stock",
        description: "Look up a single stock by ticker symbol: current price, dividend yield, dividend score, ex-div date.",
        parameters: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "Ticker (e.g. AAPL, KO, REP.MC)." }
          },
          required: [ "symbol" ]
        },
        handler: ->(symbol:, **) { GetStock.call(symbol: symbol) }
      )
    end
  end
end
