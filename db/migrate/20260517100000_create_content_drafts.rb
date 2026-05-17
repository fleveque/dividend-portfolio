class CreateContentDrafts < ActiveRecord::Migration[8.0]
  def change
    create_table :content_drafts do |t|
      t.string :topic_type, null: false
      t.string :topic_key, null: false
      t.json :payload, null: false
      t.json :inputs
      t.datetime :generated_at, null: false
      t.datetime :copied_at

      t.timestamps
    end
    add_index :content_drafts, [ :topic_type, :topic_key ]
    add_index :content_drafts, :generated_at
  end
end
