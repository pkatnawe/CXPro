import { describe, test, expect } from 'vitest';
import { getInitials } from '../identity';

describe('getInitials', () => {
  test('Two-word name returns first letter of each word uppercased', () => {
    expect(getInitials('John Smith', 'john@example.com')).toBe('JS');
  });

  test('Single-word name returns its first letter uppercased', () => {
    expect(getInitials('Alice', 'alice@example.com')).toBe('A');
  });

  test('Three-or-more-word name returns first letter of first word + first letter of last word uppercased', () => {
    expect(getInitials('Mary Jane Watson', 'mary@example.com')).toBe('MW');
  });

  test('undefined fullName falls back to first letter of email uppercased', () => {
    expect(getInitials(undefined, 'admin@example.com')).toBe('A');
  });

  test('Empty string fullName falls back to first letter of email uppercased', () => {
    expect(getInitials('', 'test@example.com')).toBe('T');
    expect(getInitials('   ', 'test@example.com')).toBe('T'); // Also test whitespace-only string
  });
});