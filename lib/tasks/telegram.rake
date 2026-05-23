namespace :telegram do
  desc "Register the Telegram webhook with the URL in TELEGRAM_WEBHOOK_URL"
  task set_webhook: :environment do
    url = ENV["TELEGRAM_WEBHOOK_URL"]
    secret = ENV["TELEGRAM_WEBHOOK_SECRET"]
    abort "TELEGRAM_WEBHOOK_URL is required (e.g. https://quantic.app/api/v1/telegram/webhook)" if url.blank?
    abort "TELEGRAM_WEBHOOK_SECRET is required" if secret.blank?
    abort "TELEGRAM_BOT_TOKEN is required" unless TelegramBot::Client.configured?

    result = TelegramBot::Client.set_webhook(url: url, secret_token: secret)
    puts JSON.pretty_generate(result || { error: "no response" })
  end

  desc "Show the currently registered webhook info"
  task webhook_info: :environment do
    abort "TELEGRAM_BOT_TOKEN is required" unless TelegramBot::Client.configured?
    result = TelegramBot::Client.webhook_info
    puts JSON.pretty_generate(result || { error: "no response" })
  end

  desc "Delete the registered webhook (e.g. for rollback)"
  task delete_webhook: :environment do
    abort "TELEGRAM_BOT_TOKEN is required" unless TelegramBot::Client.configured?
    result = TelegramBot::Client.delete_webhook
    puts JSON.pretty_generate(result || { error: "no response" })
  end
end
