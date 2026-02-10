module Authorization
  extend ActiveSupport::Concern

  private

  def require_admin
    render_error("Forbidden", status: :forbidden) unless Current.user&.admin?
  end
end
