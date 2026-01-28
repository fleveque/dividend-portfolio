module Api
  module V1
    # Base controller for all API v1 endpoints.
    #
    # Provides:
    # - JSON-only response format
    # - Standardized response helpers (render_success, render_error)
    # - Authentication via the existing Authentication concern
    # - Exception handling for common errors
    #
    # All API controllers should inherit from this class.
    class BaseController < ApplicationController
      include Authentication

      # API endpoints return JSON, not HTML, so disable the Rails feature
      # that rejects requests from old browsers
      skip_before_action :allow_browser, raise: false

      # Handle common exceptions with JSON responses
      # Order matters: Rails processes rescue_from in reverse order (last declared first)
      # So we put StandardError first as the fallback, then more specific handlers
      rescue_from StandardError, with: :internal_server_error
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActionController::ParameterMissing, with: :bad_request

      private

      # Render a successful JSON response
      # @param data [Object] The data to include in the response
      # @param status [Symbol] HTTP status code (default: :ok)
      def render_success(data, status: :ok)
        render json: { success: true, data: data }, status: status
      end

      # Render an error JSON response
      # @param message [String] Error message
      # @param status [Symbol] HTTP status code (default: :unprocessable_entity)
      def render_error(message, status: :unprocessable_entity)
        render json: { success: false, error: message }, status: status
      end

      def not_found
        render_error("Not found", status: :not_found)
      end

      def bad_request(exception)
        render_error(exception.message, status: :bad_request)
      end

      def internal_server_error(exception)
        Rails.logger.error "API Error: #{exception.class} - #{exception.message}"
        Rails.logger.error exception.backtrace.first(10).join("\n") if exception.backtrace
        render_error("Internal server error", status: :internal_server_error)
      end

      # Override the default authentication redirect for API requests.
      # Instead of redirecting to login page, return 401 Unauthorized.
      def request_authentication
        render_error("Authentication required", status: :unauthorized)
      end
    end
  end
end
