class HomeController < ApplicationController
  include StockDecoration

  allow_unauthenticated_access

  def index
    stocks = Rails.cache.fetch("last_added_stocks", expires_in: 1.hour) do
      Stock.last_added(10)
    end
    @last_added_stocks = decorate_stocks(stocks)

    top_stocks = Rails.cache.fetch("most_added_stocks", expires_in: 1.hour) do
      Radar.most_added_stocks(10)
    end
    @top_radar_stocks = decorate_stocks(top_stocks)
  end
end
