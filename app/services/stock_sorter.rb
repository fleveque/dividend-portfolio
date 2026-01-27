class StockSorter
  ABOVE_TARGET_OFFSET = 1000

  def initialize(stocks)
    @stocks = stocks
  end

  def sort
    @stocks.sort_by { |stock| sort_priority(stock) }
  end

  private

  def sort_priority(stock)
    return 1 unless stock.target_price && stock.price

    diff = percentage_difference(stock)

    if diff <= 0
      -diff.abs
    else
      diff + ABOVE_TARGET_OFFSET
    end
  end

  def percentage_difference(stock)
    return 0 if stock.target_price.nil? || stock.target_price.zero?

    ((stock.price - stock.target_price).to_f / stock.target_price) * 100
  end
end
