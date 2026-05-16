class RefreshFxRatesJob < ApplicationJob
  queue_as :default

  def perform
    pairs = FxRateService.pairs_needed
    results = FxRateService.refresh_all(pairs)
    refreshed = results.count { |_, rate| rate }
    failed = results.count - refreshed

    Rails.logger.info "RefreshFxRatesJob: Refreshed #{refreshed} pairs, #{failed} failures"
  end
end
