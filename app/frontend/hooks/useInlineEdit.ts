/**
 * useInlineEdit - Custom Hook for Inline Editing
 *
 * Custom Hooks Explained:
 * =======================
 *
 * A custom hook is a function that:
 * 1. Starts with "use" (convention that enables linting)
 * 2. Can call other hooks (useState, useEffect, etc.)
 * 3. Returns values and/or functions for the component to use
 *
 * Benefits:
 * - Reusable logic across components
 * - Separates "what" (component) from "how" (hook)
 * - Testable in isolation
 * - Keeps components clean and focused on rendering
 *
 * This hook replaces the Stimulus inline_edit_controller.js
 * but uses React's state management instead of DOM manipulation.
 *
 * Stimulus approach:
 *   - Directly manipulates DOM (createElement, innerHTML)
 *   - Manages its own event listeners
 *   - Submits forms for updates
 *
 * React approach:
 *   - Returns state values and handlers
 *   - Component renders based on state
 *   - Uses API client for updates
 */

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Configuration for the inline edit hook
 */
interface UseInlineEditOptions<T> {
  // Initial value to display and edit
  initialValue: T

  // Async function to save the new value
  onSave: (value: T) => Promise<void>

  // Optional: called after successful save
  onSuccess?: () => void

  // Optional: called on error
  onError?: (error: Error) => void
}

/**
 * Return type of the hook - what the component gets access to
 */
interface UseInlineEditReturn<T> {
  // Current state
  isEditing: boolean
  value: T
  error: string | null
  isSaving: boolean

  // Actions
  startEdit: () => void
  cancelEdit: () => void
  setValue: (value: T) => void
  save: () => Promise<void>

  // Ref for the input element (for focus management)
  inputRef: React.RefObject<HTMLInputElement | null>

  // Keyboard handler for Enter/Escape
  handleKeyDown: (event: React.KeyboardEvent) => void
}

/**
 * useInlineEdit Hook
 *
 * Manages the state and logic for inline editing functionality.
 *
 * Usage:
 *   const {
 *     isEditing, value, error, isSaving,
 *     startEdit, cancelEdit, setValue, save,
 *     inputRef, handleKeyDown
 *   } = useInlineEdit({
 *     initialValue: stock.targetPrice?.toString() ?? '',
 *     onSave: async (newValue) => {
 *       await radarApi.updateTargetPrice(stock.id, parseFloat(newValue))
 *     }
 *   })
 *
 * In JSX:
 *   {isEditing ? (
 *     <input
 *       ref={inputRef}
 *       value={value}
 *       onChange={(e) => setValue(e.target.value)}
 *       onKeyDown={handleKeyDown}
 *     />
 *   ) : (
 *     <span onClick={startEdit}>{displayValue}</span>
 *   )}
 */
export function useInlineEdit<T>({
  initialValue,
  onSave,
  onSuccess,
  onError,
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
  // Is the user currently editing?
  const [isEditing, setIsEditing] = useState(false)

  // Current value in the input
  const [value, setValue] = useState<T>(initialValue)

  // Value before editing started (for cancel/restore)
  const [originalValue, setOriginalValue] = useState<T>(initialValue)

  // Is a save operation in progress?
  const [isSaving, setIsSaving] = useState(false)

  // Error message if save failed
  const [error, setError] = useState<string | null>(null)

  // Ref for the input element (to focus it)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Start editing mode.
   * Stores the current value so we can restore it on cancel.
   */
  const startEdit = useCallback(() => {
    setOriginalValue(value)
    setIsEditing(true)
    setError(null)
  }, [value])

  /**
   * Cancel editing and restore original value.
   */
  const cancelEdit = useCallback(() => {
    setValue(originalValue)
    setIsEditing(false)
    setError(null)
  }, [originalValue])

  /**
   * Save the new value.
   * If value hasn't changed, just exit edit mode.
   */
  const save = useCallback(async () => {
    // No change? Just close edit mode
    if (value === originalValue) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(value)
      setIsEditing(false)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsSaving(false)
    }
  }, [value, originalValue, onSave, onSuccess, onError])

  /**
   * Handle keyboard events.
   * Enter = save, Escape = cancel
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        save()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        cancelEdit()
      }
    },
    [save, cancelEdit]
  )

  /**
   * Focus the input when entering edit mode.
   */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  /**
   * Update internal value when initialValue prop changes.
   * This handles the case where the parent component updates
   * the value after a save (e.g., from an API response).
   */
  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue)
      setOriginalValue(initialValue)
    }
  }, [initialValue, isEditing])

  return {
    isEditing,
    value,
    error,
    isSaving,
    startEdit,
    cancelEdit,
    setValue,
    save,
    inputRef,
    handleKeyDown,
  }
}

/**
 * Comparison: Stimulus vs React Hook
 *
 * Stimulus (inline_edit_controller.js):
 *   - Creates DOM elements imperatively
 *   - Manages event listeners manually
 *   - Submits a form for updates
 *   - Tightly coupled to the DOM structure
 *
 * React (useInlineEdit):
 *   - Returns state and handlers
 *   - Component decides how to render
 *   - Uses API client for updates
 *   - Decoupled from any specific UI
 *
 * The React approach is more flexible:
 *   - Same hook can be used for different UI designs
 *   - Easier to test (just test the hook logic)
 *   - Better TypeScript support
 */
