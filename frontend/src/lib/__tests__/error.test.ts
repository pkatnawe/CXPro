import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../error'

describe('getErrorMessage', () => {
  it('returns message from Error instance', () => {
    const error = new Error('Something went wrong')
    expect(getErrorMessage(error)).toBe('Something went wrong')
  })

  it('returns message from Supabase error object', () => {
    const error = { message: 'duplicate key', code: '23505' }
    expect(getErrorMessage(error)).toBe('duplicate key')
  })

  it('returns plain string as-is', () => {
    expect(getErrorMessage('Network error')).toBe('Network error')
  })

  it('returns "Unknown error" for null', () => {
    expect(getErrorMessage(null)).toBe('Unknown error')
  })

  it('returns JSON string for arbitrary object', () => {
    const error = { foo: 'bar', baz: 42 }
    expect(getErrorMessage(error)).toBe('{"foo":"bar","baz":42}')
  })
})