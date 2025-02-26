class HomeController < ApplicationController
  allow_unauthenticated_access

  def index
    @last_added_stocks = Rails.cache.fetch("last_added_stocks", expires_in: 1.hour) do
      Stock.last_added(10)
    end

    @top_radar_stocks = Rails.cache.fetch("most_added_stocks", expires_in: 1.hour) do
      Radar.most_added_stocks(10)
    end
  end
end
