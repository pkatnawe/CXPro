/**
 * Derives display initials from a user's full name or email.
 * 
 * @param fullName - The user's full name (optional)
 * @param email - The user's email address (fallback)
 * @returns Uppercased initials (1-2 characters)
 */
export function getInitials(fullName: string | undefined, email: string): string {
  // If fullName is undefined or empty, use email
  if (!fullName || fullName.trim() === '') {
    return email.charAt(0).toUpperCase();
  }

  const trimmedName = fullName.trim();
  const words = trimmedName.split(/\s+/);

  if (words.length === 1) {
    // Single word: return first letter
    return words[0].charAt(0).toUpperCase();
  } else if (words.length === 2) {
    // Two words: return first letter of each
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  } else {
    // Three or more words: return first letter of first and last word
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
}