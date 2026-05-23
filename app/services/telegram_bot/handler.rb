module TelegramBot
  # Routes a single Telegram `Update` payload to the right action: command
  # dispatch (`/start`, `/help`, `/unlink`) for slash commands, NLU for any
  # free-text message. Authentication state matters: linked chats can ask
  # data questions; unlinked chats only get the linking instructions.
  #
  # All entry points return without raising — Telegram retries non-2xx so an
  # uncaught error would surface as duplicate user-visible messages.
  class Handler
    SUPPORTED_LOCALES = %w[en es].freeze

    def self.process(update)
      new(update).process
    end

    def initialize(update)
      @update = update.with_indifferent_access
    end

    def process
      message = @update[:message] || @update[:edited_message]
      return unless message

      @chat_id = message.dig(:chat, :id)
      @from_id = message.dig(:from, :id)
      @locale = normalise_locale(message.dig(:from, :language_code))
      @text = message[:text].to_s.strip
      return if @chat_id.blank? || @text.blank?

      if @text.start_with?("/start")
        handle_start
      elsif linked_user
        dispatch_command_or_nlu
      else
        reply_unlinked
      end
    rescue StandardError => e
      Rails.logger.error "TelegramBot::Handler crashed: #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      Client.send_message(chat_id: @chat_id, text: t("error.unexpected")) if @chat_id
    end

    private

    attr_reader :chat_id, :from_id, :text, :locale

    def handle_start
      code = text.split(/\s+/, 2)[1].to_s.strip

      if code.empty?
        reply(t("start.no_code"))
        return
      end

      link = UserTelegramLink.consume_code(code)
      unless link
        reply(t("start.invalid_code"))
        return
      end

      link.complete!(chat_id: chat_id, telegram_user_id: from_id)
      reply(t("start.linked", email: Client.escape_markdown(link.user.email_address)))
    end

    def dispatch_command_or_nlu
      case text
      when %r{\A/help\b}i
        reply(t("help.body"))
      when %r{\A/unlink\b}i
        handle_unlink
      when %r{\A/}
        reply(t("help.unknown_command"))
      else
        handle_question
      end
    end

    def handle_unlink
      UserTelegramLink.where(chat_id: chat_id.to_s).delete_all
      reply(t("unlink.done"))
    end

    def handle_question
      user = linked_user
      gate = AiRateLimiter.allow?(user, "telegram_chat")
      unless gate.allowed?
        reply(t("rate_limited", limit: gate.limit))
        return
      end

      Client.send_typing(chat_id: chat_id)
      reply_text = Nlu.answer(question: text, user: user, locale: locale)
      reply(reply_text)
    end

    def reply_unlinked
      reply(t("unlinked"))
    end

    def reply(body)
      Client.send_message(chat_id: chat_id, text: body)
    end

    def linked_user
      @linked_user ||= begin
        link = UserTelegramLink.linked.find_by(chat_id: chat_id.to_s)
        link&.user
      end
    end

    def normalise_locale(language_code)
      lang = language_code.to_s.split("-").first&.downcase
      SUPPORTED_LOCALES.include?(lang) ? lang : "en"
    end

    def t(key, **args)
      Copy.t(key, locale: locale, **args)
    end
  end
end
