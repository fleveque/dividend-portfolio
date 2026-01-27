class StockRadarService
  Result = Struct.new(:success?, :data, :error)

  def initialize(radar)
    @radar = radar
  end

  def update_target_price(stock, new_price)
    radar_stock = RadarStock.find_by(radar: @radar, stock: stock)
    return failure("Stock not found on radar") unless radar_stock

    target_price = new_price.presence
    if radar_stock.update(target_price: target_price)
      success(radar_stock)
    else
      failure(radar_stock.errors.full_messages.join(", "))
    end
  end

  def add_stock(stock, target_price: nil)
    return failure("Stock already on radar") if @radar.stocks.include?(stock)

    radar_stock = RadarStock.create(radar: @radar, stock: stock, target_price: target_price.presence)
    radar_stock.persisted? ? success(radar_stock) : failure(radar_stock.errors.full_messages.join(", "))
  end

  def remove_stock(stock)
    @radar.stocks.delete(stock)
    success(nil)
  end

  private

  def success(data)
    Result.new(true, data, nil)
  end

  def failure(error)
    Result.new(false, nil, error)
  end
end
