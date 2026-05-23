module AiProviders
  # Normalised return shape from `BaseProvider#chat`. The provider resolves
  # any tool-call rounds internally and returns this once it has a final
  # text answer.
  #
  # @param text [String] the LLM's final natural-language reply
  # @param tool_calls [Array<Hash>] list of {name:, args:, result:} executed
  #                                 in the conversation, in order. Mostly
  #                                 useful for debugging / observability.
  ChatResult = Struct.new(:text, :tool_calls, keyword_init: true) do
    def initialize(text:, tool_calls: [])
      super
    end
  end
end
