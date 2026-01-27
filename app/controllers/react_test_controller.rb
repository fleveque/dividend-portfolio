# frozen_string_literal: true

# ReactTestController - Temporary controller for testing React setup
#
# This controller serves a minimal page that loads the React application.
# It's used during development to verify that:
# 1. Vite is serving JavaScript correctly
# 2. React mounts successfully
# 3. Components render as expected
#
# Once the migration is complete, this controller can be removed.
class ReactTestController < ApplicationController
  # Allow access without authentication for testing
  allow_unauthenticated_access

  # Use the new React layout instead of the default application layout
  layout "react"

  def index
    # The view is empty - React handles all rendering
    # The layout provides the <div id="react-root"> mount point
  end
end
