/**
 * Extract a human-readable message from any thrown value.
 *
 * Why this exists: `error instanceof Error` is false for Supabase RPC errors
 * (they are plain objects with a `message` property), causing alerts to display
 * "Unknown error" while the real reason hides in the object. Use this helper
 * everywhere instead of inlining `error instanceof Error ? error.message : ...`.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; error_description?: unknown; details?: unknown }
    if (typeof e.message === 'string') return e.message
    if (typeof e.error_description === 'string') return e.error_description
    if (typeof e.details === 'string') return e.details
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }
  return String(err ?? 'Unknown error')
}
