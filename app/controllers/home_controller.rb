class HomeController < ApplicationController
  allow_unauthenticated_access

  def index
    @aapl = FinancialDataService.get_stock("AAPL")
  end
end
