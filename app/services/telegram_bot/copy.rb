module TelegramBot
  # Bot reply copy in en + es. Keys are flat dot-paths. We use our own table
  # rather than Rails I18n because (a) the bot's locale is per-message, not
  # global, and (b) Telegram message formatting rules are easier to enforce
  # when copy lives in one place we can audit.
  #
  # Format: Telegram HTML (https://core.telegram.org/bots/api#html-style).
  # Use <b>, <i>, <code>; only `&`, `<`, `>` need escaping inside body text.
  module Copy
    STRINGS = {
      "en" => {
        "unlinked" => "👋 Hi! I'm not linked to a Quantic account yet. Open Settings in the Quantic web app and tap <b>Connect Telegram</b> to get a one-time link.",
        "start.no_code" => "Hi! To connect your Quantic account, open <b>Settings → Connect Telegram</b> in the web app and use the button there.",
        "start.invalid_code" => "That code isn't valid or has expired (codes last 10 minutes). Go to <b>Settings → Connect Telegram</b> in Quantic to get a fresh one.",
        "start.linked" => "✅ Linked to your Quantic account (%{email}).\n\nAsk me anything: <i>what dividends did I get this month?</i>, <i>show my radar</i>, <i>any ex-divs this week?</i>\nType /help for more.",
        "help.body" => "<b>Things I can answer:</b>\n• Recent dividends and totals\n• Your radar with target prices\n• Upcoming ex-div dates\n• Single-stock price + yield\n\n<b>Commands:</b>\n/help — this message\n/examples — sample questions you can ask\n/notifications — daily-digest controls (on / off / status)\n/unlink — disconnect this chat from your Quantic account",
        "help.unknown_command" => "I don't recognise that command. Try /help.",
        "examples.body" => "Some questions I can answer:\n\n• <i>what dividends did I get this month?</i>\n• <i>show my radar</i>\n• <i>any ex-divs this week?</i>\n• <i>what stocks am I holding near their 52-week low?</i>\n• <i>what dividends do I get next month?</i>\n• <i>what's the price of MSFT?</i>\n• <i>which of my stocks are below my target price?</i>\n• <i>year-to-date dividends</i>\n\nNot sure what to ask? Try one of those — the wording is flexible.",
        "unlink.done" => "Done — this chat is no longer linked to your Quantic account. Use <b>Settings → Connect Telegram</b> if you want to reconnect.",
        "notifications.on" => "✅ Daily notifications enabled. You'll get a summary every day at 09:00 UTC.",
        "notifications.off" => "🔕 Daily notifications disabled. You can re-enable any time with /notifications on.",
        "notifications.status_on" => "Daily notifications are <b>on</b>. Use /notifications off to disable.",
        "notifications.status_off" => "Daily notifications are <b>off</b>. Use /notifications on to enable a daily 09:00 UTC summary of ex-divs, dividends received, and target hits.",
        "rate_limited" => "You've used your %{limit} free AI requests today. AI calls cost real money — we're offering them free for now. Try again tomorrow.",
        "error.unexpected" => "Something went wrong on our side. We're looking into it — try again in a minute.",

        # Digest copy
        "digest.greeting" => "☀️ Good morning! Here's your Quantic update:",
        "digest.ex_divs.header" => "📅 <b>Upcoming ex-dividend dates (next 7 days)</b>",
        "digest.ex_divs.line_held" => "• %{symbol} — ex-div %{date} · est. %{amount} %{currency}",
        "digest.ex_divs.line_radar" => "• %{symbol} (radar) — ex-div %{date}",
        "digest.dividends_received.header" => "💰 <b>Dividends received yesterday</b>",
        "digest.dividends_received.total" => "Total: <b>%{amount} %{currency}</b> net",
        "digest.dividends_received.line" => "• %{symbol}: %{amount} %{currency} net",
        "digest.target_hits.header" => "🎯 <b>Stocks below your target price</b>",
        "digest.target_hits.line" => "• %{symbol}: %{price} %{currency} (target %{target} %{currency}, %{percent} below)",
        "digest.footer" => "Reply <i>/notifications off</i> to stop these. Reply <i>/help</i> for what else I can do."
      },
      "es" => {
        "unlinked" => "👋 ¡Hola! Aún no estoy vinculado a una cuenta de Quantic. Abre Ajustes en la web de Quantic y toca <b>Conectar Telegram</b> para obtener un código de enlace.",
        "start.no_code" => "¡Hola! Para conectar tu cuenta de Quantic, abre <b>Ajustes → Conectar Telegram</b> en la web y usa el botón allí.",
        "start.invalid_code" => "Ese código no es válido o ha caducado (duran 10 minutos). Ve a <b>Ajustes → Conectar Telegram</b> en Quantic para obtener uno nuevo.",
        "start.linked" => "✅ Vinculado a tu cuenta de Quantic (%{email}).\n\nPregúntame lo que quieras: <i>¿qué dividendos he recibido este mes?</i>, <i>muestra mi radar</i>, <i>¿hay ex-divs esta semana?</i>\nEscribe /help para más.",
        "help.body" => "<b>Cosas que puedo responder:</b>\n• Dividendos recientes y totales\n• Tu radar con precios objetivo\n• Próximas fechas ex-div\n• Precio y rentabilidad por acción\n\n<b>Comandos:</b>\n/help — este mensaje\n/examples — preguntas de ejemplo\n/notifications — control del resumen diario (on / off / status)\n/unlink — desconectar este chat de tu cuenta de Quantic",
        "help.unknown_command" => "No reconozco ese comando. Prueba /help.",
        "examples.body" => "Algunas preguntas que puedo responder:\n\n• <i>¿qué dividendos he recibido este mes?</i>\n• <i>muestra mi radar</i>\n• <i>¿hay ex-divs esta semana?</i>\n• <i>¿qué acciones tengo cerca de su mínimo anual?</i>\n• <i>¿qué dividendos recibiré el mes que viene?</i>\n• <i>¿cuál es el precio de MSFT?</i>\n• <i>¿cuáles de mis acciones están por debajo de mi precio objetivo?</i>\n• <i>dividendos del año en curso</i>\n\n¿No sabes qué preguntar? Prueba con una de esas — el lenguaje es flexible.",
        "unlink.done" => "Hecho — este chat ya no está vinculado a tu cuenta de Quantic. Usa <b>Ajustes → Conectar Telegram</b> si quieres reconectar.",
        "notifications.on" => "✅ Notificaciones diarias activadas. Recibirás un resumen cada día a las 09:00 UTC.",
        "notifications.off" => "🔕 Notificaciones diarias desactivadas. Puedes reactivarlas con /notifications on.",
        "notifications.status_on" => "Las notificaciones diarias están <b>activadas</b>. Usa /notifications off para desactivar.",
        "notifications.status_off" => "Las notificaciones diarias están <b>desactivadas</b>. Usa /notifications on para activar un resumen diario a las 09:00 UTC con ex-divs, dividendos recibidos y precios alcanzados.",
        "rate_limited" => "Has usado tus %{limit} solicitudes gratuitas de IA hoy. Las llamadas a IA cuestan dinero real — las ofrecemos gratis por ahora. Inténtalo de nuevo mañana.",
        "error.unexpected" => "Algo salió mal por nuestro lado. Lo estamos revisando — inténtalo de nuevo en un minuto.",

        # Digest copy
        "digest.greeting" => "☀️ ¡Buenos días! Tu resumen de Quantic:",
        "digest.ex_divs.header" => "📅 <b>Próximas fechas ex-dividendo (7 días)</b>",
        "digest.ex_divs.line_held" => "• %{symbol} — ex-div %{date} · est. %{amount} %{currency}",
        "digest.ex_divs.line_radar" => "• %{symbol} (radar) — ex-div %{date}",
        "digest.dividends_received.header" => "💰 <b>Dividendos recibidos ayer</b>",
        "digest.dividends_received.total" => "Total: <b>%{amount} %{currency}</b> neto",
        "digest.dividends_received.line" => "• %{symbol}: %{amount} %{currency} neto",
        "digest.target_hits.header" => "🎯 <b>Acciones por debajo de tu precio objetivo</b>",
        "digest.target_hits.line" => "• %{symbol}: %{price} %{currency} (objetivo %{target} %{currency}, %{percent} por debajo)",
        "digest.footer" => "Responde <i>/notifications off</i> para detener estos avisos. Escribe <i>/help</i> para ver qué más puedo hacer."
      }
    }.freeze

    def self.t(key, locale: "en", **args)
      table = STRINGS[locale] || STRINGS["en"]
      template = table[key.to_s] || STRINGS["en"][key.to_s] || key.to_s
      args.empty? ? template : (template % args)
    end
  end
end
