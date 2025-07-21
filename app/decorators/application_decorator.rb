class ApplicationDecorator < SimpleDelegator
  def initialize(object)
    super(object)
    @object = object
  end

  private

  attr_reader :object
end
