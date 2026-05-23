module TelegramBot
  # Bot reply copy in en + es. Keys are flat dot-paths. We use our own table
  # rather than Rails I18n because (a) the bot's locale is per-message, not
  # global, and (b) Telegram MarkdownV2 escaping rules are easier to enforce
  # when copy lives in one place we can audit.
  module Copy
    STRINGS = {
      "en" => {
        "unlinked" => "👋 Hi! I'm not linked to a Quantic account yet\\. Open Settings in the Quantic web app and tap *Connect Telegram* to get a one\\-time link\\.",
        "start.no_code" => "Hi\\! To connect your Quantic account, open *Settings → Connect Telegram* in the web app and use the button there\\.",
        "start.invalid_code" => "That code isn't valid or has expired \\(codes last 10 minutes\\)\\. Go to *Settings → Connect Telegram* in Quantic to get a fresh one\\.",
        "start.linked" => "✅ Linked to your Quantic account \\(%{email}\\)\\.\n\nAsk me anything: *what dividends did I get this month?*, *show my radar*, *any ex\\-divs this week?*\nType /help for more\\.",
        "help.body" => "Things I can answer:\n• Recent dividends and totals\n• Your radar with target prices\n• Upcoming ex\\-div dates\n• Single\\-stock price + yield\n\nCommands:\n/help — this message\n/unlink — disconnect this chat from your Quantic account",
        "help.unknown_command" => "I don't recognise that command\\. Try /help\\.",
        "unlink.done" => "Done — this chat is no longer linked to your Quantic account\\. Use *Settings → Connect Telegram* if you want to reconnect\\.",
        "rate_limited" => "You've used your %{limit} free AI requests today\\. AI calls cost real money — we're offering them free for now\\. Try again tomorrow\\.",
        "error.unexpected" => "Something went wrong on our side\\. We're looking into it — try again in a minute\\."
      },
      "es" => {
        "unlinked" => "👋 ¡Hola! Aún no estoy vinculado a una cuenta de Quantic\\. Abre Ajustes en la web de Quantic y toca *Conectar Telegram* para obtener un código de enlace\\.",
        "start.no_code" => "¡Hola\\! Para conectar tu cuenta de Quantic, abre *Ajustes → Conectar Telegram* en la web y usa el botón allí\\.",
        "start.invalid_code" => "Ese código no es válido o ha caducado \\(duran 10 minutos\\)\\. Ve a *Ajustes → Conectar Telegram* en Quantic para obtener uno nuevo\\.",
        "start.linked" => "✅ Vinculado a tu cuenta de Quantic \\(%{email}\\)\\.\n\nPregúntame lo que quieras: *¿qué dividendos he recibido este mes?*, *muestra mi radar*, *¿hay ex\\-divs esta semana?*\nEscribe /help para más\\.",
        "help.body" => "Cosas que puedo responder:\n• Dividendos recientes y totales\n• Tu radar con precios objetivo\n• Próximas fechas ex\\-div\n• Precio y rentabilidad por acción\n\nComandos:\n/help — este mensaje\n/unlink — desconectar este chat de tu cuenta de Quantic",
        "help.unknown_command" => "No reconozco ese comando\\. Prueba /help\\.",
        "unlink.done" => "Hecho — este chat ya no está vinculado a tu cuenta de Quantic\\. Usa *Ajustes → Conectar Telegram* si quieres reconectar\\.",
        "rate_limited" => "Has usado tus %{limit} solicitudes gratuitas de IA hoy\\. Las llamadas a IA cuestan dinero real — las ofrecemos gratis por ahora\\. Inténtalo de nuevo mañana\\.",
        "error.unexpected" => "Algo salió mal por nuestro lado\\. Lo estamos revisando — inténtalo de nuevo en un minuto\\."
      }
    }.freeze

    def self.t(key, locale: "en", **args)
      table = STRINGS[locale] || STRINGS["en"]
      template = table[key.to_s] || STRINGS["en"][key.to_s] || key.to_s
      args.empty? ? template : (template % args)
    end
  end
end
