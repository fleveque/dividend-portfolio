module AiProviders
  # Provider-agnostic tool/function spec for LLM tool calling. Each concrete
  # provider (Gemini, Anthropic, OpenAI, …) is responsible for translating this
  # to its native shape (`functionDeclarations`, `tools`, …) and for invoking
  # `handler` with the parsed arguments when the LLM picks the tool.
  #
  # @param name [String] machine-readable identifier (e.g. "get_radar")
  # @param description [String] explains the tool to the LLM
  # @param parameters [Hash] JSON Schema for the tool's args (lowercase keys)
  # @param handler [#call] receives a symbolised-keys hash of args, returns
  #                        a value the provider can serialise to JSON for the
  #                        follow-up turn (Hash / Array / String / Numeric).
  Tool = Struct.new(:name, :description, :parameters, :handler, keyword_init: true) do
    def invoke(args)
      handler.call(**args.transform_keys(&:to_sym))
    end
  end
end
