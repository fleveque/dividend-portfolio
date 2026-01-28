/**
 * Application Entry Point
 *
 * This renders the root App component which contains all other components.
 * In Phase 9, we'll add React Router here for client-side navigation.
 */

import { createRoot } from 'react-dom/client'
import App from '../components/App'

const container = document.getElementById('react-root')

if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
