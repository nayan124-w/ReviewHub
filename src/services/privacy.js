/**
 * 🔒 PRIVACY SERVICE
 * 
 * This module enforces strict privacy rules:
 * - Companies NEVER see reviewer identity (name, email, userId, college)
 * - Users can see non-anonymous reviewer profiles
 * - All reviews shown to companies are sanitized
 */

/**
 * Sanitize a review for company view.
 * Strips ALL user-identifying information.
 * @param {Object} review - Raw review from Firestore
 * @returns {Object} Sanitized review safe for company viewing
 */
export const sanitizeReviewForCompany = (review) => {
  // STRICT ALLOWLIST — only these fields are returned to companies
  // userId, userName, userEmail, userCollege, isAnonymous are ALL EXCLUDED
  return {
    id: review.id,
    rating: review.rating,
    description: review.description,
    title: review.title || '',
    createdAt: review.createdAt,
    proofUrl: review.proofUrl || null,
    proofType: review.proofType || null,
    helpful: review.helpful || 0,
    companyId: review.companyId,
    companyReply: review.companyReply || null,
    companyReplyAt: review.companyReplyAt || null,
  };
};

/**
 * Sanitize a review for user/public view.
 * Shows reviewer identity only if review is NOT anonymous.
 * @param {Object} review - Raw review from Firestore
 * @param {boolean} isCompanyViewer - Whether the viewer is a company
 * @returns {Object} Appropriately sanitized review
 */
export const sanitizeReviewForView = (review, isCompanyViewer = false) => {
  // If viewer is a company, always strip identity
  if (isCompanyViewer) {
    return sanitizeReviewForCompany(review);
  }

  // For user/public view — show identity only if not anonymous
  if (review.isAnonymous) {
    return {
      ...review,
      userName: 'Anonymous',
      userId: review.userId, // Keep userId for ownership check by current user
      userEmail: undefined,
    };
  }

  // Non-anonymous: show everything to users
  return review;
};

/**
 * Batch-sanitize an array of reviews for company viewing.
 * @param {Array} reviews - Array of raw reviews
 * @returns {Array} Array of sanitized reviews
 */
export const sanitizeReviewsForCompany = (reviews) => {
  return reviews.map(sanitizeReviewForCompany);
};

/**
 * Batch-sanitize reviews for public/user viewing.
 * @param {Array} reviews - Array of raw reviews
 * @param {boolean} isCompanyViewer
 * @returns {Array}
 */
export const sanitizeReviewsForView = (reviews, isCompanyViewer = false) => {
  return reviews.map((r) => sanitizeReviewForView(r, isCompanyViewer));
};

/**
 * Check if a user object represents a company account.
 * @param {Object} userProfile - The user profile object
 * @returns {boolean}
 */
export const isCompanyAccount = (userProfile) => {
  return userProfile?.role === 'company';
};
