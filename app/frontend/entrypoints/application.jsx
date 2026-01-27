/**
 * Application Entry Point
 *
 * This is the "main" file where JavaScript execution begins.
 * Vite looks for files in the entrypoints/ directory and treats
 * each one as a separate bundle.
 *
 * Note: ES modules (type="module") are automatically deferred,
 * so the DOM is ready when this code runs - no need for DOMContentLoaded.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import StockCard from '../components/StockCard'

// Sample data for testing - in Phase 3, we'll fetch this from the API
const sampleStock = {
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 178.50
}

// Find the container element where React will render
const container = document.getElementById('react-root')

if (container) {
  // Create a React root and render
  const root = createRoot(container)
  root.render(<StockCard stock={sampleStock} />)
  console.log('React mounted successfully!')
}
