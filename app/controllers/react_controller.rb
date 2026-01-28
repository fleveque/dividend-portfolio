# frozen_string_literal: true

# ReactController - Serves the React SPA
#
# This controller serves the React application for all frontend routes.
# React Router handles client-side navigation once the app loads.
#
# All routes (/, /login, /radar, etc.) serve the same HTML page,
# which loads the React app. React Router then reads the URL and
# renders the appropriate component.
#
# Phase 9: React Router Integration
class ReactController < ApplicationController
  # Allow access without authentication - React handles auth
  allow_unauthenticated_access

  # Use the React layout (loads Vite + React)
  layout "react"

  def index
    # Empty action - React handles all rendering
    # The layout provides <div id="react-root"> mount point
  end
end
