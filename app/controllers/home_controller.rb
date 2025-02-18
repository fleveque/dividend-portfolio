class HomeController < ApplicationController
  allow_unauthenticated_access

  def index
    @aapl = YahooFinanceClient::Stock.get_quote("AAPL")
  end
end
