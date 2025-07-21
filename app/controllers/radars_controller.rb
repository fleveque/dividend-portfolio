class RadarsController < ApplicationController
  before_action :set_or_create_radar, only: [ :show, :update, :search, :destroy_stock ]

  def show
    stocks = @radar.sorted_stocks || []
    @stocks = stocks.map { |stock| StockDecorator.new(stock) }
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
    message = update_target_price(stock) || handle_stock_action(stock)
    redirect_to radar_path(@radar), notice: message
  end

  def destroy_stock
    stock = Stock.find(params[:stock_id])
    @radar.stocks.delete(stock)
    redirect_to radar_path(@radar), notice: "Stock was successfully removed from radar."
  end

  def search
    stocks = @radar.stocks || []
    @stocks = stocks.map { |stock| StockDecorator.new(stock) }
    search_results = perform_search(params[:query])
    @search_results = search_results.map { |stock| StockDecorator.new(stock) }

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

  def update_target_price(stock)
    return unless params[:target_price].present?

    radar_stock = @radar.radars_stocks.find_by(stock_id: stock.id)
    if radar_stock.update(target_price: params[:target_price])
      "Target price was successfully updated."
    else
      "Failed to update target price."
    end
  end

  def handle_stock_action(stock)
    if params[:action_type] == "add"
      @radar.stocks << stock unless @radar.stocks.include?(stock)
      "Stock was successfully added to radar."
    else
      @radar.stocks.delete(stock)
      "Stock was successfully removed from radar."
    end
  end

  def perform_search(query)
    return [] unless query.present?

    stock = FinancialDataService.get_stock(query)
    stock ? [ stock ] : []
  end

  def set_or_create_radar
    @radar = Current.user.radar || Current.user.create_radar
  end

  def radar_params
    params.require(:radar).permit(:action_type, :stock_symbol, :target_price)
  end

  def search_params
    params.permit(:query)
  end
end
