module PortfolioPayloadBuilder
  module_function

  def call(user)
    {
      slug: user.portfolio_slug,
      holdings: user.holdings.includes(:stock).map { |h| serialize_holding(h) }
    }
  end

  def serialize_holding(holding)
    {
      symbol: holding.stock.symbol,
      quantity: holding.quantity.to_f,
      avg_price: holding.average_price.to_f,
      price: (holding.stock.price || 0).to_f
    }
  end
end
