module Api
  module V1
    module Admin
      class UsersController < BaseController
        # GET /api/v1/admin/users
        def index
          users = User.left_joins(:radar)
                      .left_joins(:transactions)
                      .select(
                        "users.*",
                        "COUNT(DISTINCT radar_stocks.stock_id) AS radar_stocks_count",
                        "COUNT(DISTINCT transactions.id) AS transactions_count"
                      )
                      .left_joins(radar: :radar_stocks)
                      .group("users.id")
                      .order(created_at: :desc)

          render_success(users.map { |user| serialize_admin_user(user) })
        end

        # DELETE /api/v1/admin/users/:id
        def destroy
          user = User.find(params[:id])

          if user.id == Current.user.id
            return render_error("Cannot delete yourself", status: :unprocessable_entity)
          end

          user.destroy!
          render_success({ deleted: true })
        end

        private

        def serialize_admin_user(user)
          {
            id: user.id,
            emailAddress: user.email_address,
            name: user.name,
            admin: user.admin?,
            provider: user.provider,
            createdAt: user.created_at.iso8601,
            radarStocksCount: user.radar_stocks_count.to_i,
            transactionsCount: user.transactions_count.to_i
          }
        end
      end
    end
  end
end
