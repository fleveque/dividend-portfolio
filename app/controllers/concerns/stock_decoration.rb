# frozen_string_literal: true

module StockDecoration
  extend ActiveSupport::Concern

  private

  def decorate_stocks(stocks)
    stocks.map { |stock| StockDecorator.new(stock) }
  end
end
