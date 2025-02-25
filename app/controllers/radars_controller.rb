class RadarsController < ApplicationController
  before_action :set_or_create_radar, only: [ :show, :update, :search ]

  def show
    @stocks = @radar.stocks || []
  end

  def create
    @radar = Current.user.build_radar
    if @radar.save
      redirect_to radar_path(@radar), notice: "Radar was successfully created."
    else
      redirect_to root_path, alert: "Unable to create radar."
    end
  end

  def update
    stock = Stock.find(params[:stock_id])
    if params[:action_type] == "add"
      @radar.stocks << stock unless @radar.stocks.include?(stock)
      message = "Stock was successfully added to radar."
    else
      @radar.stocks.delete(stock)
      message = "Stock was successfully removed from radar."
    end
    redirect_to radar_path(@radar), notice: message
  end

  def search
    @stocks = @radar.stocks || []
    @search_results = perform_search(params[:query])

    respond_to do |format|
      format.html { render "show", locals: { search_results: @search_results } }
      format.turbo_stream {
        render turbo_stream: turbo_stream.update(
          "search_results", partial: "search_results",
          locals: { search_results: @search_results }
        )
      }
    end
  end

  private

  def perform_search(query)
    return [] unless query.present?

    stock = FinancialDataService.get_stock(query)
    stock ? [ stock ] : []
  end

  def set_or_create_radar
    @radar = Current.user.radar || Current.user.create_radar
  end

  def radar_params
    params.require(:radar).permit(:action_type, :stock_symbol)
  end

  def search_params
    params.permit(:query)
  end
end
