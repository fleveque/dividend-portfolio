module Telegram
  # Fires once a day (Solid Queue recurring; see config/recurring.yml) and
  # sends each opted-in user a daily digest of upcoming ex-divs, dividends
  # received yesterday, and target-price hits.
  #
  # One failed user shouldn't take down the rest, so each user is wrapped
  # in its own rescue. Empty digests are skipped — the build method
  # returns nil when there's nothing to say.
  class DailyDigestJob < ApplicationJob
    queue_as :default

    def perform
      UserTelegramLink.linked.where(notifications_enabled: true).find_each do |link|
        begin
          deliver_for(link)
        rescue StandardError => e
          Rails.logger.error "DailyDigestJob: failed for user #{link.user_id}: #{e.class}: #{e.message}"
        end
      end
    end

    private

    def deliver_for(link)
      message = DailyDigest.build(user: link.user, locale: link.user.locale)
      return if message.blank? # nothing to say today

      TelegramBot::Client.send_message(chat_id: link.chat_id, text: message)
    end
  end
end
