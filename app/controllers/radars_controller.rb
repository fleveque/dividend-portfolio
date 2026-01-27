class RadarsController < ApplicationController
  include StockDecoration

  before_action :set_or_create_radar, only: [ :show, :update, :search, :destroy_stock ]
  before_action :set_stock_radar_service, only: [ :update, :destroy_stock ]

  def show
    stocks = @radar.sorted_stocks || []
    @stocks = decorate_stocks(stocks)
  end

  def create
    @radar = Current.user.build_radar
    if @radar.save
      redirect_to radar_path, notice: "Radar was successfully created."
    else
      redirect_to root_path, alert: "Unable to create radar."
    end
  end

  def update
    begin
      stock = Stock.find(params[:stock_id])

      # Handle AJAX target price updates
      if request.xhr? && params[:action_type] == "update_target"
        return update_target_price_ajax(stock)
      end

      # Handle Turbo Stream inline target price updates
      if params[:action_type] == "update_target_inline"
        return update_target_price_turbo(stock)
      end

      message = update_target_price(stock) || handle_stock_action(stock)
      return if message == :rendered
      redirect_to radar_path, notice: message
    rescue ActiveRecord::RecordNotFound
      if request.xhr?
        render json: { success: false, error: "Stock not found on radar" }, status: :not_found
      else
        redirect_to radar_path, alert: "Stock not found."
      end
    end
  end

  def destroy_stock
    stock = Stock.find(params[:stock_id])
    @service.remove_stock(stock)
    redirect_to radar_path, notice: "Stock was successfully removed from radar."
  end

  def search
    stocks = @radar.stocks || []
    @stocks = decorate_stocks(stocks)
    search_results = perform_search(params[:query])
    @search_results = decorate_stocks(search_results)

    respond_to do |format|
      format.html { render "show", locals: { search_results: @search_results } }
      format.turbo_stream do
        render turbo_stream: turbo_stream.update(
          "search_results", partial: "search_results",
          locals: { search_results: @search_results }
        )
      end
    end
  end

  private

  def update_target_price_ajax(stock)
    result = @service.update_target_price(stock, params[:target_price])

    unless result.success?
      return render json: { success: false, error: result.error }, status: :not_found
    end

    radar_stock = result.data
    decorated_stock = StockDecorator.new(stock, target_price: radar_stock.target_price)
    render json: {
      success: true,
      target_price: decorated_stock.formatted_target_price,
      price_status_class: decorated_stock.price_status_class
    }
  end

  def update_target_price_turbo(stock)
    result = @service.update_target_price(stock, params[:target_price])

    unless result.success?
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "stock_#{stock.id}_target_price",
            partial: "error_message",
            locals: { message: result.error }
          )
        end
      end
      return
    end

    radar_stock = result.data
    decorated_stock = StockDecorator.new(stock, target_price: radar_stock.target_price)

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.replace("stock_#{stock.id}_target_price", partial: "target_price_display", locals: { stock: decorated_stock }),
          turbo_stream.replace("stock_#{stock.id}_row", partial: "stock_row", locals: { stock: decorated_stock })
        ]
      end
    end
  end

  def update_target_price(stock)
    return unless params[:target_price].present?

    result = @service.update_target_price(stock, params[:target_price])
    result.success? ? "Target price was successfully updated." : "Failed to update target price."
  end

  def handle_stock_action(stock)
    case params[:action_type]
    when "add"
      result = @service.add_stock(stock, target_price: params[:target_price])
      result.success? ? "Stock was successfully added to radar." : result.error
    when "remove"
      @service.remove_stock(stock)
      "Stock was successfully removed from radar."
    else
      if request.xhr?
        render json: { success: false, error: "Invalid action" }, status: :bad_request
      else
        redirect_to radar_path, alert: "Invalid action"
      end
      :rendered # Signal that response was already sent
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

  def set_stock_radar_service
    @service = StockRadarService.new(@radar)
  end

  def radar_params
    params.require(:radar).permit(:action_type, :stock_symbol, :target_price)
  end

  def search_params
    params.permit(:query)
  end
end
