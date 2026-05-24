module AiProviders
  class GeminiProvider < BaseProvider
    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent".freeze

    def name
      :gemini
    end

    def radar_insights(stocks_data, locale: nil, preferred_currency: nil)
      return empty_radar_insights if stocks_data.blank?

      lang = normalized_locale(locale)
      ccy = preferred_currency || "USD"
      prompt = build_radar_prompt(stocks_data, lang, ccy)
      response = call_gemini(prompt, radar_response_schema)
      parse_response(response)
    end

    def portfolio_insights(stocks_data, locale: nil, preferred_currency: nil)
      return empty_portfolio_insights if stocks_data.blank?

      lang = normalized_locale(locale)
      ccy = preferred_currency || "USD"
      prompt = build_portfolio_prompt(stocks_data, lang, ccy)
      response = call_gemini(prompt, radar_response_schema)
      parse_response(response)
    end

    def stock_summary(stock_data, locale: nil, preferred_currency: nil)
      return empty_stock_summary if stock_data.blank?

      lang = normalized_locale(locale)
      ccy = preferred_currency || "USD"
      prompt = build_stock_prompt(stock_data, lang, ccy)
      response = call_gemini(prompt, stock_response_schema)
      parse_response(response)
    end

    # Generate a social-media post for X and LinkedIn from a content topic.
    # Topic shape: { category:, topic_key:, inputs: {…} }. No caching: every
    # button click should produce a fresh draft, not return a stale one.
    def social_post(topic, locale: nil)
      lang = normalized_locale(locale)
      prompt = build_social_post_prompt(topic, lang)
      response = call_gemini(prompt, social_post_response_schema)
      parse_response(response)
    end

    # Multi-turn chat with function calling (the bot's NLU layer). Walks the
    # tool-call loop internally: send → maybe-get-functionCall → invoke local
    # handler → send result back → repeat (capped at `max_tool_rounds`) →
    # return the LLM's final text reply.
    def chat(messages:, tools: [], system: nil, locale: nil, max_tool_rounds: 3)
      raise AiError, "GEMINI_API_KEY is not configured" if api_key.blank?

      lang = normalized_locale(locale)
      tools_by_name = tools.index_by(&:name)
      contents = messages.map { |m| { role: gemini_role(m[:role]), parts: [ { text: m[:text] } ] } }
      executed_calls = []

      max_tool_rounds.times do
        response = call_gemini_chat(
          contents: contents,
          system: [ system, language_instruction(lang) ].compact.reject(&:empty?).join("\n"),
          tools: tools
        )

        parts = response.dig("candidates", 0, "content", "parts") || []
        function_call = parts.find { |p| p["functionCall"] }&.dig("functionCall")

        unless function_call
          text = parts.map { |p| p["text"] }.compact.join.strip
          return ChatResult.new(text: text, tool_calls: executed_calls)
        end

        tool = tools_by_name[function_call["name"]]
        if tool.nil?
          Rails.logger.warn "Gemini called unknown tool: #{function_call["name"]}"
          return ChatResult.new(text: "", tool_calls: executed_calls)
        end

        args = function_call["args"] || {}
        result = tool.invoke(args)
        executed_calls << { name: tool.name, args: args, result: result }

        # Append the model's functionCall turn + our functionResponse turn so
        # the next round sees the full history.
        contents << { role: "model", parts: [ { functionCall: function_call } ] }
        contents << {
          role: "user",
          parts: [ { functionResponse: { name: tool.name, response: { result: result } } } ]
        }
      end

      ChatResult.new(text: "", tool_calls: executed_calls)
    end

    private

    SUPPORTED_LOCALES = %w[en es].freeze

    def normalized_locale(locale)
      lang = locale.to_s.split("-").first&.downcase
      SUPPORTED_LOCALES.include?(lang) ? lang : "en"
    end

    def language_instruction(lang)
      return "" if lang == "en"

      "\nIMPORTANT: Respond entirely in Spanish (Español). All text in your response must be in Spanish."
    end

    def api_key
      ENV["GEMINI_API_KEY"]
    end

    # 4096 is well within Flash's 8192 cap and leaves slack for Gemini 2.5's
    # "thinking" tokens, which silently consume the output budget before the
    # actual response — at 1024 we hit intermittent "response not valid JSON
    # (truncated)" errors even for short outputs like stock summaries.
    def call_gemini(prompt, schema, max_output_tokens: 4096)
      raise AiError, "GEMINI_API_KEY is not configured" if api_key.blank?

      uri = URI("#{GEMINI_API_URL}?key=#{api_key}")

      body = {
        system_instruction: { parts: [ { text: prompt[:system] } ] },
        contents: [ { parts: [ { text: prompt[:user] } ] } ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7,
          maxOutputTokens: max_output_tokens
        }
      }

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 10
      http.read_timeout = 30

      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request.body = body.to_json

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        raise AiError, "Gemini API error: #{response.code} #{response.message}"
      end

      JSON.parse(response.body)
    end

    # Variant of `call_gemini` for the chat / tool-calling path: no
    # responseSchema (the model can choose tool calls *or* free text), and
    # the conversation history (`contents`) plus tool declarations are
    # passed through verbatim.
    def call_gemini_chat(contents:, system:, tools:, max_output_tokens: 4096)
      uri = URI("#{GEMINI_API_URL}?key=#{api_key}")
      body = {
        system_instruction: { parts: [ { text: system } ] },
        contents: contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: max_output_tokens
        }
      }
      if tools.any?
        body[:tools] = [
          { functionDeclarations: tools.map { |t| { name: t.name, description: t.description, parameters: t.parameters } } }
        ]
      end

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 10
      # 60s ceiling: multi-tool-round chats can legitimately take 20-30s
      # when Gemini reasons about which tool to call; 30s was clipping some
      # successful responses and the bot would silently fail.
      http.read_timeout = 60

      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request.body = body.to_json

      response = http.request(request)
      raise AiError, "Gemini API error: #{response.code} #{response.message}" unless response.is_a?(Net::HTTPSuccess)
      JSON.parse(response.body)
    end

    def gemini_role(role)
      role.to_s == "assistant" ? "model" : "user"
    end

    def parse_response(response)
      text = response.dig("candidates", 0, "content", "parts", 0, "text")
      raise AiError, "Unexpected Gemini response structure" if text.blank?

      parsed = JSON.parse(text)
      parsed.deep_symbolize_keys
    rescue JSON::ParserError => e
      # Most common cause: maxOutputTokens cut the response off mid-JSON.
      # Bubble up as AiError so callers' rescue clauses handle it.
      raise AiError, "Gemini response was not valid JSON (likely truncated): #{e.message}"
    end

    def build_radar_prompt(stocks_data, lang = "en", preferred_currency = "USD")
      {
        system: <<~SYSTEM,
          You are a dividend investment analyst assistant. Analyze the user's stock watchlist and provide actionable insights.
          Focus on dividend investing strategy: yield quality, payout sustainability, portfolio diversification by payment months, and value opportunities.
          Be concise and specific. Reference stocks by their symbol.
          Prices are denominated in each stock's quoted currency, see the `currency` field on every row; do not assume a single currency across the portfolio.
          The user's display currency is #{preferred_currency}. If you summarise any portfolio-wide value, use #{preferred_currency} and note that it's converted from each stock's native currency.
          IMPORTANT: The "targetPrice" field is NOT an analyst target — it is the price at which the user personally wants to act (buy or sell). Treat it as the user's desired action price.#{language_instruction(lang)}
        SYSTEM
        user: <<~USER
          Analyze this stock watchlist and provide insights:

          #{stocks_data.to_json}

          Provide:
          1. A brief portfolio summary (2-3 sentences)
          2. Buying opportunities (stocks trading below target or near 52-week lows with good fundamentals)
          3. Dividend coverage gaps (months with no dividend income)
          4. Risk flags (high payout ratios, low scores, stocks trading well above MA200)
          5. Portfolio strengths (good diversification, strong yields, consistent payers)
        USER
      }
    end

    def build_portfolio_prompt(stocks_data, lang = "en", preferred_currency = "USD")
      {
        system: <<~SYSTEM,
          You are a dividend investment analyst assistant. Analyze the user's actual portfolio holdings and provide actionable insights.
          Focus on dividend investing strategy: yield quality, payout sustainability, portfolio diversification by payment months, and value opportunities.
          Be concise and specific. Reference stocks by their symbol.
          Prices are denominated in each stock's quoted currency, see the `currency` field on every row; do not assume a single currency across the portfolio.
          The user's display currency is #{preferred_currency}. If you summarise any portfolio-wide value, use #{preferred_currency} and note that it's converted from each stock's native currency.
          IMPORTANT: The "targetPrice" field is NOT an analyst target — it is the price at which the user personally wants to act (buy or sell). Treat it as the user's desired action price.#{language_instruction(lang)}
        SYSTEM
        user: <<~USER
          Analyze this portfolio of owned stocks and provide insights:

          #{stocks_data.to_json}

          Provide:
          1. A brief portfolio summary (2-3 sentences)
          2. Buying opportunities (stocks that could strengthen the portfolio, or existing positions worth adding to)
          3. Dividend coverage gaps (months with no dividend income)
          4. Risk flags (high payout ratios, low scores, concentration risk, stocks trading well above MA200)
          5. Portfolio strengths (good diversification, strong yields, consistent payers)
        USER
      }
    end

    def build_stock_prompt(stock_data, lang = "en", preferred_currency = "USD")
      {
        system: <<~SYSTEM,
          You are a dividend investment analyst assistant. Provide a concise assessment of an individual stock for dividend investing.
          Consider yield, payout ratio, PE ratio, price vs target, 52-week position, dividend score, and MA200 trend.
          Be specific and actionable. Prices are denominated in this stock's quoted currency, see the `currency` field.
          The user's display currency is #{preferred_currency}; if you reference any computed value, use #{preferred_currency}.
          IMPORTANT: The "targetPrice" field is NOT an analyst target — it is the price at which the user personally wants to act (buy or sell). Treat it as the user's desired action price.#{language_instruction(lang)}
        SYSTEM
        user: <<~USER
          Assess this stock for dividend investing:

          #{stock_data.to_json}

          Provide a 2-3 sentence summary, a verdict (strong_buy, buy, hold, caution, or avoid), and 2-3 key bullet points.
        USER
      }
    end

    def radar_response_schema
      {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          buyingOpportunities: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                symbol: { type: "STRING" },
                reason: { type: "STRING" }
              },
              required: %w[symbol reason]
            }
          },
          coverageGaps: { type: "STRING" },
          riskFlags: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                symbol: { type: "STRING" },
                flag: { type: "STRING" }
              },
              required: %w[symbol flag]
            }
          },
          strengths: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: %w[summary buyingOpportunities coverageGaps riskFlags strengths]
      }
    end

    def stock_response_schema
      {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          verdict: {
            type: "STRING",
            enum: %w[strong_buy buy hold caution avoid]
          },
          keyPoints: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: %w[summary verdict keyPoints]
      }
    end

    def empty_radar_insights
      {
        summary: "Add stocks to your radar to get AI-powered portfolio insights.",
        buyingOpportunities: [],
        coverageGaps: "No stocks to analyze.",
        riskFlags: [],
        strengths: []
      }
    end

    def empty_portfolio_insights
      {
        summary: "Add stocks to your portfolio to get AI-powered insights.",
        buyingOpportunities: [],
        coverageGaps: "No stocks to analyze.",
        riskFlags: [],
        strengths: []
      }
    end

    def empty_stock_summary
      {
        summary: "No data available for analysis.",
        verdict: "hold",
        keyPoints: []
      }
    end

    # Voice rules baked into the system prompt — applied uniformly across
    # categories so every draft sounds like Quantic.
    SOCIAL_VOICE_RULES = <<~RULES.freeze
      Brand: Quantic — practical dividend-investing tools, EU-friendly, multi-currency aware. Slightly nerdy, never preachy.
      Educational framing only. Never give buy/sell advice or imply Quantic recommends an action.
      Always include a concrete number (yield, %, count, date). No vague claims.
      X: single hook, max 280 chars including hashtags. One stat or one question. 0–2 hashtags (e.g. #dividends, $TICKER).
      LinkedIn: 600–1500 chars. One paragraph of setup, optional 3-bullet list, one paragraph close. Professional but warm. 1–3 hashtags at the end.
      No emojis on LinkedIn. At most one tasteful emoji on X.
      Never name a Quantic user, never paste a portfolio slug or URL.
    RULES

    def build_social_post_prompt(topic, lang = "en")
      category = topic[:category] || topic["category"]
      inputs   = topic[:inputs]   || topic["inputs"] || {}

      framing = social_post_framing_for(category.to_s)

      {
        system: <<~SYSTEM,
          You write short social-media posts for Quantic's accounts on X and LinkedIn.
          #{SOCIAL_VOICE_RULES}#{language_instruction(lang)}
        SYSTEM
        user: <<~USER
          Topic category: #{category}
          Framing for this category: #{framing}

          Use ONLY the data below. Do not invent figures.

          ```
          #{JSON.pretty_generate(inputs)}
          ```

          Output the post via the structured response.
        USER
      }
    end

    def social_post_framing_for(category)
      case category
      when "stock_of_the_day"
        "Spotlight on a single dividend stock. Lead with one specific number from the data (yield, score, payment frequency, ex-div date). Don't recommend buying."
      when "dividend_calendar"
        "This-week-in-dividends roundup. Mention 2–4 specific tickers and their ex-div dates from the data. Frame as a date to watch, not a trade idea."
      when "pulse_aggregates"
        "Anonymised community observation. Lead with the cohort count or the top-held ticker. Never name a specific user. Frame as 'what the Quantic community is tracking'."
      when "feature_announcement"
        "New-feature announcement. Lead with the benefit, not the implementation. X teases; LinkedIn explains the problem the feature solves and who it helps."
      else
        "Write a short post tied to the data below."
      end
    end

    def social_post_response_schema
      {
        type: "OBJECT",
        properties: {
          headline: { type: "STRING" },
          x: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING", maxLength: 280 }
            },
            required: %w[text]
          },
          linkedin: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING" }
            },
            required: %w[text]
          },
          hashtags: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: %w[headline x linkedin hashtags]
      }
    end

    def empty_social_post
      {
        headline: "",
        x: { text: "" },
        linkedin: { text: "" },
        hashtags: []
      }
    end
  end
end
