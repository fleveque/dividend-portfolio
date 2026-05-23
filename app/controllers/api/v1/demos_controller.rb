module Api
  module V1
    # Public endpoint serving the curated demo bundle for anonymous visitors
    # browsing `/demo`. No DB writes, no broadcast, no caching — just a static
    # JSON snapshot.
    class DemosController < BaseController
      allow_unauthenticated_access only: [ :show ]

      # GET /api/v1/demo
      def show
        render_success(Demos::DataBundle.call)
      end
    end
  end
end
