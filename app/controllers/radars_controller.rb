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
      redirect_to radar_path(@radar), notice: message
    rescue ActiveRecord::RecordNotFound
      if request.xhr?
        render json: { success: false, error: "Stock not found on radar" }, status: :not_found
      else
        redirect_to radar_path(@radar), alert: "Stock not found."
      end
    end
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

  def update_target_price_ajax(stock)
    radar_stock = RadarStock.find_by(radar: @radar, stock: stock)

    unless radar_stock
      return render json: { success: false, error: "Stock not found on radar" }, status: :not_found
    end

    target_price = params[:target_price].present? ? params[:target_price] : nil

    if radar_stock.update(target_price: target_price)
      decorated_stock = StockDecorator.new(stock.tap { |s| s.define_singleton_method(:target_price) { radar_stock.target_price } })
      render json: {
        success: true,
        target_price: decorated_stock.formatted_target_price,
        price_status_class: decorated_stock.price_status_class
      }
    else
      render json: {
        success: false,
        errors: radar_stock.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update_target_price_turbo(stock)
    radar_stock = RadarStock.find_by(radar: @radar, stock: stock)

    unless radar_stock
      respond_to do |format|
        format.turbo_stream { 
          render turbo_stream: turbo_stream.replace(
            "stock_#{stock.id}_target_price", 
            partial: "error_message", 
            locals: { message: "Stock not found on radar" }
          )
        }
      end
      return
    end

    target_price = params[:target_price].present? ? params[:target_price] : nil

    if radar_stock.update(target_price: target_price)
      # Refresh the decorated stock with updated target price
      decorated_stock = StockDecorator.new(stock.tap { |s| s.define_singleton_method(:target_price) { radar_stock.target_price } })
      
      respond_to do |format|
        format.turbo_stream { 
          render turbo_stream: [
            turbo_stream.replace("stock_#{stock.id}_target_price", partial: "target_price_display", locals: { stock: decorated_stock }),
            turbo_stream.replace("stock_#{stock.id}_row", partial: "stock_row", locals: { stock: decorated_stock })
          ]
        }
      end
    else
      respond_to do |format|
        format.turbo_stream { 
          render turbo_stream: turbo_stream.replace(
            "stock_#{stock.id}_target_price", 
            partial: "error_message", 
            locals: { message: radar_stock.errors.full_messages.join(", ") }
          )
        }
      end
    end
  end

  def update_target_price(stock)
    return unless params[:target_price].present?

    radar_stock = RadarStock.find_by(radar: @radar, stock: stock)
    if radar_stock&.update(target_price: params[:target_price])
      "Target price was successfully updated."
    else
      "Failed to update target price."
    end
  end

  def handle_stock_action(stock)
    case params[:action_type]
    when "add"
      unless @radar.stocks.include?(stock)
        target_price = params[:target_price].present? ? params[:target_price] : nil
        RadarStock.create!(radar: @radar, stock: stock, target_price: target_price)
      end
      "Stock was successfully added to radar."
    when "remove"
      @radar.stocks.delete(stock)
      "Stock was successfully removed from radar."
    else
      if request.xhr?
        render json: { success: false, error: "Invalid action" }, status: :bad_request
      else
        redirect_to radar_path(@radar), alert: "Invalid action"
      end
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
