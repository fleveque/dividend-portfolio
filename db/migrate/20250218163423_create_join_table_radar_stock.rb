class CreateJoinTableRadarStock < ActiveRecord::Migration[8.0]
  def change
    create_join_table :radars, :stocks do |t|
      t.index [ :radar_id, :stock_id ]
      t.index [ :stock_id, :radar_id ]
    end
  end
end
