module TelegramBot
  # Glue layer between the handler and the AI provider: assembles the system
  # prompt + tools, runs `AiProviders.current.chat`, and returns a single
  # ready-to-send Telegram reply string.
  #
  # Rate-limit accounting: caller (`Handler`) gates *before* calling here.
  # We log an AiRequest *after* a successful round-trip so failed/empty
  # responses don't consume quota.
  module Nlu
    SYSTEM_PROMPT = <<~PROMPT.freeze
      You are Quantic's dividend-investing assistant, embedded in Telegram. The user has connected their Quantic account, so you can answer questions about their personal radar (watchlist), holdings (portfolio), and dividends.

      Use the provided tools to fetch data — never make up numbers. If a tool returns empty, say so. If the question is outside Quantic (general financial advice, news, predictions), politely decline and remind them what you can answer.

      Reply style:
      - Short. Mobile-readable. 2–6 short paragraphs max, or a compact list.
      - Use the user's locale for prose.
      - Format with Telegram MarkdownV2: bold via *text*, italics via _text_, monospace via `text`. Always escape literal periods, exclamation marks, parentheses, hyphens, equals, plus, etc. with a backslash inside body text. Currency amounts are fine in monospace.
      - Don't give buy/sell advice. Reference the user's own target prices ("you set a target of X") not your opinion.
      - Lead with the answer, then 1–2 lines of context if useful. Never preface with "Sure!" or similar.
    PROMPT

    def self.answer(question:, user:, locale: "en")
      tools = Tools.all_for(user)
      messages = [ { role: "user", text: question } ]

      result = AiProviders.current.chat(
        messages: messages,
        tools: tools,
        system: SYSTEM_PROMPT,
        locale: locale
      )

      AiRateLimiter.record!(user: user, feature: "telegram_chat", provider: AiProviders.current.name)

      reply = result.text.to_s.strip
      reply.presence || Copy.t("error.unexpected", locale: locale)
    rescue AiProviders::BaseProvider::AiError => e
      Rails.logger.error "TelegramBot::Nlu AiError: #{e.message}"
      Copy.t("error.unexpected", locale: locale)
    end
  end
end
