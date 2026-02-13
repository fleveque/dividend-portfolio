class StockDecorator < ApplicationDecorator
  PAYMENTS_PER_YEAR = {
    "monthly" => 12, "quarterly" => 4, "semi_annual" => 2, "annual" => 1
  }.freeze

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

  def formatted_eps
    return "N/A" unless eps
    "$#{sprintf('%.2f', eps)}"
  end

  def formatted_pe_ratio
    return "N/A" unless pe_ratio
    "#{sprintf('%.1f', pe_ratio)}x"
  end

  def formatted_dividend
    return "N/A" unless dividend
    "$#{sprintf('%.2f', dividend)}"
  end

  def formatted_dividend_yield
    return "N/A" unless dividend_yield
    "#{sprintf('%.2f', dividend_yield)}%"
  end

  def formatted_payout_ratio
    return "N/A" unless payout_ratio
    "#{sprintf('%.1f', payout_ratio)}%"
  end

  def formatted_ma_50
    return "N/A" unless ma_50
    "$#{sprintf('%.2f', ma_50)}"
  end

  def formatted_ma_200
    return "N/A" unless ma_200
    "$#{sprintf('%.2f', ma_200)}"
  end

  def formatted_fifty_two_week_high
    return "N/A" unless fifty_two_week_high
    format_currency(fifty_two_week_high)
  end

  def formatted_fifty_two_week_low
    return "N/A" unless fifty_two_week_low
    format_currency(fifty_two_week_low)
  end

  def fifty_two_week_range_position
    return nil unless fifty_two_week_data_available? && price

    range = fifty_two_week_high - fifty_two_week_low
    return 50.0 if range.zero?

    ((price - fifty_two_week_low).to_f / range.to_f * 100).clamp(0.0, 100.0).round(1)
  end

  def fifty_two_week_data_available?
    fifty_two_week_high.present? && fifty_two_week_low.present?
  end

  def payment_months
    stored = object.payment_months
    return stored if stored.is_a?(Array) && stored.any?

    []
  end

  def shifted_payment_months
    stored = object.shifted_payment_months
    return stored if stored.is_a?(Array) && stored.any?

    []
  end

  def dividend_per_payment
    return nil unless dividend_schedule_available? && dividend.present?

    per_year = PAYMENTS_PER_YEAR[payment_frequency] || payment_months.size
    return nil unless per_year&.positive?

    (dividend.to_f / per_year).round(4)
  end

  def formatted_dividend_per_payment
    value = dividend_per_payment
    return "N/A" unless value

    "$#{sprintf('%.2f', value)}"
  end

  def formatted_payment_frequency
    return "N/A" unless payment_frequency

    payment_frequency.titleize
  end

  def formatted_ex_dividend_date
    return "N/A" unless ex_dividend_date

    ex_dividend_date.strftime("%b %d, %Y")
  end

  def dividend_schedule_available?
    payment_months.any? && payment_frequency.present?
  end

  def dividend_score
    yield_score + payout_score + pe_score + ma200_score + schedule_score
  end

  def dividend_score_label
    return nil unless has_sufficient_data_for_score?

    case dividend_score
    when 8..10 then "Strong"
    when 5..7  then "Fair"
    else "Weak"
    end
  end

  private

  def yield_score
    return 0 unless dividend_yield

    if dividend_yield >= 3
      2
    elsif dividend_yield >= 1
      1
    else
      0
    end
  end

  def payout_score
    return 0 unless payout_ratio

    if payout_ratio <= 60
      2
    elsif payout_ratio <= 80
      1
    else
      0
    end
  end

  def pe_score
    return 0 unless pe_ratio

    if pe_ratio <= 15
      2
    elsif pe_ratio <= 25
      1
    else
      0
    end
  end

  def ma200_score
    return 0 unless price && ma_200

    if price <= ma_200
      2
    elsif price <= ma_200 * 1.1
      1
    else
      0
    end
  end

  def schedule_score
    return 0 unless dividend_schedule_available?

    quarterly_or_more = %w[monthly quarterly].include?(payment_frequency)
    quarterly_or_more ? 2 : 1
  end

  def has_sufficient_data_for_score?
    count = 0
    count += 1 if dividend_yield
    count += 1 if payout_ratio
    count += 1 if pe_ratio
    count += 1 if price && ma_200
    count += 1 if dividend_schedule_available?
    count >= 2
  end

  def prices_available?
    target_price.present? && current_price.present?
  end

  def format_currency(value)
    "$#{sprintf('%.2f', value)}"
  end
end
