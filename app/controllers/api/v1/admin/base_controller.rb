module Api
  module V1
    module Admin
      class BaseController < Api::V1::BaseController
        include Authorization

        before_action :require_admin
      end
    end
  end
end
