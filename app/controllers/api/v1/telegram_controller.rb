module Api
  module V1
    # Public webhook endpoint Telegram POSTs every incoming message to. The
    # secret-token check is the only auth — Telegram includes
    # `X-Telegram-Bot-Api-Secret-Token` on every webhook call with the value
    # we set via `setWebhook` (held in `TELEGRAM_WEBHOOK_SECRET`).
    #
    # We always return 200 OK regardless of processing outcome: Telegram retries
    # non-2xx, which would cause duplicate user-visible messages. Real failures
    # are logged inside the handler.
    class TelegramController < BaseController
      allow_unauthenticated_access only: [ :webhook ]
      skip_before_action :verify_authenticity_token, only: [ :webhook ]

      # POST /api/v1/telegram/webhook
      def webhook
        return head(:forbidden) unless valid_secret?

        update = params.permit!.to_h
        TelegramBot::Handler.process(update)
        head :ok
      end

      private

      def valid_secret?
        expected = ENV["TELEGRAM_WEBHOOK_SECRET"]
        return false if expected.blank?

        provided = request.headers["X-Telegram-Bot-Api-Secret-Token"]
        ActiveSupport::SecurityUtils.secure_compare(provided.to_s, expected)
      end
    end
  end
end
