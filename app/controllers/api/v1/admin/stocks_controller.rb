module Api
  module V1
    module Admin
      class StocksController < BaseController
        # POST /api/v1/admin/stocks/refresh
        def refresh
          RefreshStocksJob.perform_later
          render_success({ enqueued: true })
        end
      end
    end
  end
end
