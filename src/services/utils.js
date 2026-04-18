/**
 * UTILITY HELPERS
 * Common utility functions used across the app.
 */

/**
 * Retry an async function with exponential backoff.
 * Useful for flaky network requests to Firebase.
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Max number of retries (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 500)
 * @returns {Promise<*>} Result of the function
 */
export const retryAsync = async (fn, retries = 3, baseDelay = 500) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
        console.warn(
          `Retry ${attempt + 1}/${retries} after ${Math.round(delay)}ms:`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('All retries exhausted:', lastError);
  throw lastError;
};

/**
 * Safe wrapper for async operations with error logging.
 * Returns [result, error] tuple instead of throwing.
 * 
 * @param {Function} fn - Async function to execute
 * @returns {Promise<[any, null] | [null, Error]>}
 */
export const safeAsync = async (fn) => {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    console.error('safeAsync error:', error);
    return [null, error];
  }
};

/**
 * Format a Firestore timestamp to a readable date string.
 * @param {Object|Date|null} timestamp - Firestore timestamp or Date
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatTimestamp = (timestamp, options = {}) => {
  if (!timestamp) return '—';
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return date.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format relative time (e.g., "2h ago", "3d ago").
 * @param {Object|Date|null} timestamp
 * @returns {string}
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
