export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      return 'Network error. Please check your connection.'
    }
    // Payload errors
    if (error.message.includes('duplicate')) {
      return 'A record with that value already exists.'
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'The requested record was not found.'
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'You do not have permission to perform this action.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
