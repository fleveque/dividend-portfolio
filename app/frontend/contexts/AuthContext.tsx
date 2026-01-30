/**
 * Authentication Context
 *
 * React Context Explained:
 * ========================
 *
 * Context provides a way to pass data through the component tree without
 * having to pass props down manually at every level.
 *
 * The pattern has three parts:
 * 1. createContext() - Creates the context object
 * 2. Provider component - Wraps the app and provides the value
 * 3. useContext() hook - Consumes the value in any child component
 *
 * Think of it like a "global variable" but React-aware:
 * - When the context value changes, all consumers re-render
 * - It's scoped to the Provider's subtree (not truly global)
 *
 * Common use cases:
 * - Authentication state (current user)
 * - Theme (dark/light mode)
 * - Locale/language settings
 * - Shopping cart contents
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '../types'
import { sessionApi } from '../lib/api'

/**
 * Define the shape of our auth context.
 * This is what components will have access to.
 */
interface AuthContextType {
  // Current user (null if not logged in)
  user: User | null

  // Convenience boolean for conditional rendering
  isAuthenticated: boolean

  // True while checking initial auth status
  isLoading: boolean

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, passwordConfirmation: string) => Promise<void>
  logout: () => Promise<void>

  // Force refresh auth state (useful after external changes)
  refreshAuth: () => Promise<void>
}

/**
 * Create the context with undefined as default.
 *
 * We use undefined (not null) so we can detect if someone tries
 * to use the context outside of a Provider.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider Component
 *
 * Wraps your app and provides authentication state to all children.
 *
 * Usage:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 * Then in any child component:
 *   const { user, isAuthenticated, login, logout } = useAuth()
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // State for the current user
  const [user, setUser] = useState<User | null>(null)

  // State for initial loading (checking if already logged in)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Check authentication status.
   * Called on mount and can be called manually via refreshAuth.
   */
  const checkAuth = useCallback(async () => {
    try {
      const userData = await sessionApi.check()
      setUser(userData)
    } catch {
      // If check fails, user is not authenticated
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Login with email and password.
   * Throws an error if login fails (caller should handle).
   */
  const login = useCallback(async (email: string, password: string) => {
    const userData = await sessionApi.login(email, password)
    setUser(userData)
  }, [])

  /**
   * Sign up with email and password.
   * Throws an error if sign up fails (caller should handle).
   */
  const signUp = useCallback(async (email: string, password: string, passwordConfirmation: string) => {
    const userData = await sessionApi.signUp(email, password, passwordConfirmation)
    setUser(userData)
  }, [])

  /**
   * Logout the current user.
   */
  const logout = useCallback(async () => {
    await sessionApi.logout()
    setUser(null)
  }, [])

  /**
   * Check auth status on mount.
   *
   * This runs once when the app loads to see if the user
   * is already logged in (has a valid session cookie).
   */
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  /**
   * The value object that will be provided to consumers.
   *
   * We memoize the object to prevent unnecessary re-renders.
   * However, since we're using useCallback for functions,
   * and primitives for other values, this is mostly for clarity.
   */
  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    signUp,
    logout,
    refreshAuth: checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use the auth context.
 *
 * This is the recommended way to consume context in function components.
 * It also adds a helpful error if used outside of AuthProvider.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * Why export both AuthProvider and useAuth?
 *
 * - AuthProvider: Used once at the top of your app
 * - useAuth: Used in any component that needs auth data
 *
 * This separation keeps the API clean:
 *   import { AuthProvider } from './contexts/AuthContext'  // For App.tsx
 *   import { useAuth } from './contexts/AuthContext'       // For components
 */
