require 'rails_helper'

RSpec.describe "Radar target price inline editing", type: :system, js: true do
  let(:user) { create(:user) }
  let(:stock) { create(:stock, symbol: 'AAPL', name: 'Apple Inc.', price: 150.00) }
  let!(:radar) { create(:radar, user: user) }
  let!(:radar_stock) { RadarStock.create!(radar: radar, stock: stock, target_price: 140.00) }

  before do
    sign_in user
    visit radar_path
  end

  it "displays target price inline edit form" do
    expect(page).to have_content('AAPL')
    expect(page).to have_content('$140.0')

    # Find the inline edit element
    expect(page).to have_css("[data-target-price-editable]")
    expect(page).to have_css("input[data-target-price-input]", visible: false)
  end

  it "allows inline editing of target price", skip: "Requires JavaScript driver" do
    # Click on the target price to edit
    target_price_element = find("[data-target-price-editable]")
    target_price_element.click

    # Input field should become visible
    expect(page).to have_css("input[data-target-price-input]", visible: true)

    # Enter new target price
    input_field = find("input[data-target-price-input]")
    input_field.fill_in with: "175.50"

    # Submit by pressing Enter or clicking outside
    input_field.send_keys(:return)

    # Wait for AJAX to complete and check updated value
    expect(page).to have_content('$175.5')
    expect(radar_stock.reload.target_price).to eq(BigDecimal('175.50'))
  end

  it "handles canceling inline edit", skip: "Requires JavaScript driver" do
    target_price_element = find("[data-target-price-editable]")
    target_price_element.click

    input_field = find("input[data-target-price-input]")
    input_field.fill_in with: "999.99"

    # Cancel by pressing Escape
    input_field.send_keys(:escape)

    # Should revert to original value
    expect(page).to have_content('$140.0')
    expect(radar_stock.reload.target_price).to eq(BigDecimal('140.00'))
  end

  it "handles invalid target price input", skip: "Requires JavaScript driver" do
    target_price_element = find("[data-target-price-editable]")
    target_price_element.click

    input_field = find("input[data-target-price-input]")
    input_field.fill_in with: "-10.00"
    input_field.send_keys(:return)

    # Should show error message or revert
    expect(page).to have_content('$140.0')
    expect(radar_stock.reload.target_price).to eq(BigDecimal('140.00'))
  end

  it "allows removing target price", skip: "Requires JavaScript driver" do
    target_price_element = find("[data-target-price-editable]")
    target_price_element.click

    input_field = find("input[data-target-price-input]")
    input_field.fill_in with: ""
    input_field.send_keys(:return)

    # Should show N/A for no target price
    expect(page).to have_content('N/A')
    expect(radar_stock.reload.target_price).to be_nil
  end
end
