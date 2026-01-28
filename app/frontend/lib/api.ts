/**
 * API Client for communicating with Rails backend.
 *
 * This module provides type-safe functions for all API endpoints.
 * It handles:
 * - CSRF token extraction and inclusion
 * - Consistent error handling
 * - JSON serialization/deserialization
 *
 * CSRF (Cross-Site Request Forgery) Protection:
 * Rails includes a CSRF token in the HTML page via a <meta> tag.
 * All non-GET requests must include this token in the X-CSRF-Token header.
 * This prevents malicious sites from making requests on behalf of the user.
 */

import type { Stock, RadarStock, User } from '../types'

const API_BASE = '/api/v1'

// Standard API response format from our Rails controllers
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Extract CSRF token from the meta tag in the HTML head.
 * Rails adds this via <%= csrf_meta_tags %> in the layout.
 */
function getCsrfToken(): string | null {
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  return metaTag?.getAttribute('content') ?? null
}

/**
 * Generic fetch wrapper with error handling.
 * Handles CSRF tokens, JSON parsing, and error responses.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  }

  // Add CSRF token for non-GET requests (POST, PATCH, DELETE)
  if (options.method && options.method !== 'GET') {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      ;(headers as Record<string, string>)['X-CSRF-Token'] = csrfToken
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    // Include cookies (session) with the request
    credentials: 'same-origin',
  })

  const data: ApiResponse<T> = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.error || `HTTP error ${response.status}`)
  }

  return data.data as T
}

// ============================================================================
// Stock API - Public endpoints (no auth required)
// ============================================================================

export const stocksApi = {
  /**
   * Get all stocks (limited to 50)
   */
  getAll: () => apiFetch<Stock[]>('/stocks'),

  /**
   * Get a single stock by ID
   */
  getById: (id: number) => apiFetch<Stock>(`/stocks/${id}`),

  /**
   * Get the most recently added stocks
   */
  getLastAdded: () => apiFetch<Stock[]>('/stocks/last_added'),

  /**
   * Get stocks most frequently added to radars
   */
  getMostAdded: () => apiFetch<Stock[]>('/stocks/most_added'),

  /**
   * Search for a stock by symbol
   */
  search: (query: string) =>
    apiFetch<Stock[]>(`/stocks/search?query=${encodeURIComponent(query)}`),
}

// ============================================================================
// Radar API - Authenticated endpoints (user's watchlist)
// ============================================================================

interface RadarResponse {
  id: number
  stocks: RadarStock[]
}

export const radarApi = {
  /**
   * Get the current user's radar with all stocks
   */
  get: () => apiFetch<RadarResponse>('/radar'),

  /**
   * Add a stock to the user's radar
   */
  addStock: (stockId: number, targetPrice?: number) =>
    apiFetch<RadarStock>(`/radar/stocks/${stockId}`, {
      method: 'POST',
      body: JSON.stringify({ target_price: targetPrice }),
    }),

  /**
   * Remove a stock from the user's radar
   */
  removeStock: (stockId: number) =>
    apiFetch<{ removed: boolean }>(`/radar/stocks/${stockId}`, {
      method: 'DELETE',
    }),

  /**
   * Update the target price for a stock on the radar
   */
  updateTargetPrice: (stockId: number, targetPrice: number | null) =>
    apiFetch<RadarStock>(`/radar/stocks/${stockId}/target_price`, {
      method: 'PATCH',
      body: JSON.stringify({ target_price: targetPrice }),
    }),
}

// ============================================================================
// Session API - Authentication
// ============================================================================

export const sessionApi = {
  /**
   * Check if user is currently logged in
   * Returns user data if authenticated, null if not
   */
  check: () => apiFetch<User | null>('/session'),

  /**
   * Login with email and password
   */
  login: (emailAddress: string, password: string) =>
    apiFetch<User>('/session', {
      method: 'POST',
      body: JSON.stringify({ email_address: emailAddress, password }),
    }),

  /**
   * Logout - destroys the current session
   */
  logout: () =>
    apiFetch<{ logged_out: boolean }>('/session', {
      method: 'DELETE',
    }),
}
