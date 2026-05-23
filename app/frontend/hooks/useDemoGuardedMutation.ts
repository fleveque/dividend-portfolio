import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query'
import { useDemoMode, type NudgeAction } from '../contexts/DemoModeContext'

// Tagged Error so callers can choose to swallow demo blocks silently.
export class DemoModeBlockedError extends Error {
  constructor() {
    super('demo-mode-blocked')
    this.name = 'DemoModeBlockedError'
  }
}

export function isDemoBlockedError(err: unknown): boolean {
  return err instanceof DemoModeBlockedError || (err instanceof Error && err.message === 'demo-mode-blocked')
}

// Wraps `useMutation` so that, when the surrounding `DemoModeProvider` reports
// demo mode, calling `.mutate()` or `.mutateAsync()` short-circuits: it
// triggers the sign-up nudge with the supplied `action` key, doesn't hit the
// API, and (for the async variant) rejects with `DemoModeBlockedError` so
// callers can opt-in to silent handling. Behaves identically to a regular
// `useMutation` outside demo mode.
export function useDemoGuardedMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  action: NudgeAction,
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { isDemoMode, triggerNudge } = useDemoMode()
  const mutation = useMutation(options)

  if (!isDemoMode) return mutation

  const blockedMutate = ((..._args: unknown[]) => {
    triggerNudge(action)
  }) as UseMutationResult<TData, TError, TVariables, TContext>['mutate']

  const blockedMutateAsync = ((..._args: unknown[]) => {
    triggerNudge(action)
    return Promise.reject(new DemoModeBlockedError())
  }) as UseMutationResult<TData, TError, TVariables, TContext>['mutateAsync']

  return { ...mutation, mutate: blockedMutate, mutateAsync: blockedMutateAsync }
}
