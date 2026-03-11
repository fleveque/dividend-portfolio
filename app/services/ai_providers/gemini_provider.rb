module AiProviders
  class GeminiProvider < BaseProvider
    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent".freeze

    def radar_insights(stocks_data, locale: nil)
      return empty_radar_insights if stocks_data.blank?

      fingerprint = Digest::MD5.hexdigest(stocks_data.to_json)
      lang = normalized_locale(locale)
      cache_key = "ai/radar/#{fingerprint}/#{lang}"

      cache_fetch(cache_key) do
        prompt = build_radar_prompt(stocks_data, lang)
        response = call_gemini(prompt, radar_response_schema)
        parse_response(response)
      end
    end

    def portfolio_insights(stocks_data, locale: nil)
      return empty_portfolio_insights if stocks_data.blank?

      fingerprint = Digest::MD5.hexdigest(stocks_data.to_json)
      lang = normalized_locale(locale)
      cache_key = "ai/portfolio/#{fingerprint}/#{lang}"

      cache_fetch(cache_key) do
        prompt = build_portfolio_prompt(stocks_data, lang)
        response = call_gemini(prompt, radar_response_schema)
        parse_response(response)
      end
    end

    def stock_summary(stock_data, locale: nil)
      return empty_stock_summary if stock_data.blank?

      lang = normalized_locale(locale)
      cache_key = "ai/stock/#{stock_data[:id]}/#{stock_data[:updated_at]}/#{lang}"

      cache_fetch(cache_key) do
        prompt = build_stock_prompt(stock_data, lang)
        response = call_gemini(prompt, stock_response_schema)
        parse_response(response)
      end
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

    def call_gemini(prompt, schema)
      raise AiError, "GEMINI_API_KEY is not configured" if api_key.blank?

      uri = URI("#{GEMINI_API_URL}?key=#{api_key}")

      body = {
        system_instruction: { parts: [ { text: prompt[:system] } ] },
        contents: [ { parts: [ { text: prompt[:user] } ] } ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7,
          maxOutputTokens: 1024
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

    def parse_response(response)
      text = response.dig("candidates", 0, "content", "parts", 0, "text")
      raise AiError, "Unexpected Gemini response structure" if text.blank?

      parsed = JSON.parse(text)
      parsed.deep_symbolize_keys
    end

    def build_radar_prompt(stocks_data, lang = "en")
      {
        system: <<~SYSTEM,
          You are a dividend investment analyst assistant. Analyze the user's stock watchlist and provide actionable insights.
          Focus on dividend investing strategy: yield quality, payout sustainability, portfolio diversification by payment months, and value opportunities.
          Be concise and specific. Reference stocks by their symbol.
          All prices are in USD.
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

    def build_portfolio_prompt(stocks_data, lang = "en")
      {
        system: <<~SYSTEM,
          You are a dividend investment analyst assistant. Analyze the user's actual portfolio holdings and provide actionable insights.
          Focus on dividend investing strategy: yield quality, payout sustainability, portfolio diversification by payment months, and value opportunities.
          Be concise and specific. Reference stocks by their symbol.
          All prices are in USD.
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

    def build_stock_prompt(stock_data, lang = "en")
      {
        system: <<~SYSTEM,
          You are a dividend investment analyst assistant. Provide a concise assessment of an individual stock for dividend investing.
          Consider yield, payout ratio, PE ratio, price vs target, 52-week position, dividend score, and MA200 trend.
          Be specific and actionable. All prices are in USD.
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
  end
end
