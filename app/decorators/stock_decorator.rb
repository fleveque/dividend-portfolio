class StockDecorator < ApplicationDecorator
  def initialize(stock, target_price: nil)
    super(stock)
    @explicit_target_price = target_price
  end

  def target_price
    return @explicit_target_price if @explicit_target_price
    return nil unless object.respond_to?(:target_price)

    object.target_price
  end

  def current_price
    price
  end

  def formatted_price
    return "N/A" unless price
    format_currency(price)
  end

  def formatted_target_price
    return "N/A" unless target_price
    format_currency(target_price)
  end

  def display_name
    "#{symbol} - #{name}"
  end

  def price_status_class
    return "border-gray-500" unless prices_available?

    if current_price < target_price
      "border-green-500 bg-gradient-to-r from-green-100 to-green-300"
    elsif current_price > target_price
      "border-red-500 bg-gradient-to-r from-red-100 to-red-300"
    else
      "border-black"
    end
  end

  def percentage_difference_from_target
    return nil unless prices_available?

    ((current_price - target_price) / target_price).abs * 100
  end

  def formatted_percentage_difference
    diff = percentage_difference_from_target
    return nil unless diff

    "#{diff.round(2)}%"
  end

  def above_target?
    prices_available? && current_price > target_price
  end

  def below_target?
    prices_available? && current_price < target_price
  end

  def at_target?
    prices_available? && current_price == target_price
  end

  def target_status_text
    return "No target set" unless target_price

    if below_target?
      "Below target"
    elsif above_target?
      "Above target"
    else
      "At target"
    end
  end

  private

  def prices_available?
    target_price.present? && current_price.present?
  end

  def format_currency(value)
    "$#{sprintf('%.2f', value)}"
  end
end
