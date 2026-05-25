module Api
  module V1
    # Settings-page integration for connecting a Telegram chat. `create` mints
    # a one-time code + deep-link URL the frontend opens; the actual linking
    # happens when the user completes `/start <code>` in Telegram and the
    # webhook fires (see `TelegramController` + `TelegramBot::Handler`).
    class TelegramLinksController < BaseController
      # GET /api/v1/telegram_link → { connected: true/false, telegramUserId?, linkedAt? }
      def show
        link = UserTelegramLink.linked.find_by(user: Current.user)
        render_success(serialize(link))
      end

      # POST /api/v1/telegram_link → { code, deepLinkUrl, expiresAt }
      # Issues a fresh code and computes the t.me deep link. Always overwrites
      # any previous pending code for this user.
      def create
        if TelegramBot::Client.bot_handle.blank?
          return render_error("Telegram bot is not configured", status: :service_unavailable)
        end

        link = UserTelegramLink.start_linking!(Current.user)
        render_success({
          code: link.code,
          deepLinkUrl: "https://t.me/#{TelegramBot::Client.bot_handle}?start=#{link.code}",
          expiresAt: link.expires_at.iso8601
        })
      end

      # PATCH /api/v1/telegram_link → updated link status
      # body: { notifications_enabled: bool }
      # Settings page calls this when the user toggles the daily-digest
      # switch. The bot's `/notifications on|off` command writes the same
      # column, so the two surfaces stay in sync.
      def update
        link = UserTelegramLink.linked.find_by(user: Current.user)
        return render_error("Telegram is not connected", status: :not_found) unless link

        params_hash = params.permit(:notifications_enabled).to_h
        if params_hash.key?("notifications_enabled")
          link.update!(notifications_enabled: ActiveModel::Type::Boolean.new.cast(params_hash["notifications_enabled"]))
        end

        render_success(serialize(link))
      end

      # DELETE /api/v1/telegram_link → { unlinked: true }
      def destroy
        UserTelegramLink.where(user: Current.user).delete_all
        render_success({ unlinked: true })
      end

      private

      def serialize(link)
        return { connected: false } unless link
        {
          connected: true,
          telegramUserId: link.telegram_user_id,
          linkedAt: link.linked_at&.iso8601,
          notificationsEnabled: link.notifications_enabled
        }
      end
    end
  end
end
