require "net/http"
require "json"

# Thin wrapper around the Telegram Bot HTTP API. Only the methods the bot
# actually uses are exposed — extend as features land. Configuration comes
# from env so the same code runs in dev (with ngrok) and prod without changes.
#
# Outbound calls are best-effort: on transport failures we log and return nil
# rather than raise, so an unrelated message failure doesn't blow up the
# webhook (which Telegram retries on non-2xx responses, leading to duplicate
# user-visible messages).
module TelegramBot
  class Client
    API_BASE = "https://api.telegram.org".freeze

    # Characters that MUST be escaped in MarkdownV2 (per Telegram docs).
    MARKDOWN_V2_ESCAPE = /([_*\[\]()~`>#+\-=|{}.!\\])/.freeze

    class << self
      def send_message(chat_id:, text:, parse_mode: "MarkdownV2", disable_web_page_preview: true)
        post("sendMessage", {
          chat_id: chat_id,
          text: text,
          parse_mode: parse_mode,
          disable_web_page_preview: disable_web_page_preview
        })
      end

      def send_typing(chat_id:)
        post("sendChatAction", { chat_id: chat_id, action: "typing" })
      end

      def set_webhook(url:, secret_token:)
        post("setWebhook", {
          url: url,
          secret_token: secret_token,
          allowed_updates: [ "message" ],
          drop_pending_updates: true
        })
      end

      def delete_webhook
        post("deleteWebhook", { drop_pending_updates: true })
      end

      def webhook_info
        post("getWebhookInfo", {})
      end

      # Escape arbitrary text for safe interpolation into a MarkdownV2 message.
      # NB: callers building richly-formatted strings should escape *data*
      # portions only, not the surrounding markdown.
      def escape_markdown(text)
        text.to_s.gsub(MARKDOWN_V2_ESCAPE, '\\\\\1')
      end

      def bot_token
        ENV["TELEGRAM_BOT_TOKEN"]
      end

      # The bot's @handle (without the `@`), used to build deep-link URLs.
      # Set when registering the bot with @BotFather.
      def bot_handle
        ENV["TELEGRAM_BOT_HANDLE"]
      end

      def configured?
        bot_token.present?
      end

      private

      def post(method, body)
        return nil unless configured?

        uri = URI("#{API_BASE}/bot#{bot_token}/#{method}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 10

        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request.body = body.to_json

        response = http.request(request)
        parsed = JSON.parse(response.body)
        unless parsed["ok"]
          Rails.logger.warn "Telegram API #{method} not ok: #{parsed["description"]}"
        end
        parsed
      rescue StandardError => e
        Rails.logger.error "Telegram API #{method} failed: #{e.class}: #{e.message}"
        nil
      end
    end
  end
end
