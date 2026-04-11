import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeReviewsByUser, deleteReview, updateReview } from '../services/reviews';
import { getCompanyById } from '../services/companies';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [actionInProgress, setActionInProgress] = useState(null); // reviewId or null

  /* ── Real-time subscription to user's reviews ── */
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeReviewsByUser(user.uid, async (rawReviews) => {
      // Enrich each review with its company name
      const enriched = await Promise.all(
        rawReviews.map(async (review) => {
          try {
            const company = await getCompanyById(review.companyId);
            return { ...review, companyName: company?.name || 'Unknown Company' };
          } catch {
            return { ...review, companyName: 'Unknown Company' };
          }
        })
      );
      setReviews(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  /* ── Helpers ── */
  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    // Handle Firestore Timestamp objects
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    // Handle ISO string
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMemberYear = () => {
    if (!userProfile?.createdAt) return '—';
    if (userProfile.createdAt.seconds) {
      return new Date(userProfile.createdAt.seconds * 1000).getFullYear();
    }
    return new Date(userProfile.createdAt).getFullYear();
  };

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  /* ── Edit handlers ── */
  const startEdit = (review) => {
    setEditingReview(review.id);
    setEditText(review.description);
    setEditRating(review.rating);
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setEditText('');
    setEditRating(0);
  };

  const saveEdit = async (reviewId) => {
    if (!editText.trim()) {
      toast.error('Review text cannot be empty');
      return;
    }
    try {
      setActionInProgress(reviewId);
      await updateReview(reviewId, {
        description: editText.trim(),
        rating: editRating,
      });
      toast.success('Review updated!');
      setEditingReview(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update review');
    } finally {
      setActionInProgress(null);
    }
  };

  /* ── Delete handler ── */
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      setActionInProgress(reviewId);
      await deleteReview(reviewId);
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="page-container py-8 sm:py-12">
      {/* ── Profile Card ── */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-8 slide-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary-500/20 flex-shrink-0">
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1 truncate">
              {user?.displayName || 'User'}
            </h1>
            <p className="text-slate-400 text-sm mb-3 truncate">{user?.email}</p>
            <span className="text-xs font-medium text-slate-400 px-3 py-1 rounded-full glass-light inline-block">
              Member since {getMemberYear()}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Reviews</p>
            </div>
            <div className="w-px h-10 bg-slate-700/50" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{averageRating}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white">Your Reviews</h2>
        <Link to="/" className="btn-secondary text-sm self-start sm:self-auto">
          Browse Companies
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your reviews..." />
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 sm:p-12 text-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">No reviews yet</h3>
          <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">
            Start sharing your experience — browse companies and write your first review!
          </p>
          <Link to="/" className="btn-primary">Explore Companies</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="glass-light rounded-xl p-5 fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <Link
                    to={`/company/${review.companyId}`}
                    className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {review.companyName}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(review.createdAt)}</p>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {/* Content */}
              <h4 className="text-base font-semibold text-white mb-1">{review.title}</h4>

              {editingReview === review.id ? (
                /* ── EDIT MODE ── */
                <div className="mt-3 space-y-3">
                  {/* Star picker */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-6 h-6 ${star <= editRating ? 'text-amber-400' : 'text-slate-600'} transition-colors`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                    <span className="text-xs text-slate-400 ml-2">{editRating}/5</span>
                  </div>

                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(review.id)}
                      disabled={actionInProgress === review.id}
                      className="btn-primary text-xs !py-1.5 !px-3 disabled:opacity-50"
                    >
                      {actionInProgress === review.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── READ MODE ── */
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                  {review.description}
                </p>
              )}

              {/* Actions & Meta */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/5">
                {editingReview !== review.id && (
                  <>
                    <button
                      onClick={() => startEdit(review)}
                      disabled={actionInProgress === review.id}
                      className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={actionInProgress === review.id}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium disabled:opacity-50"
                    >
                      {actionInProgress === review.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </>
                )}

                {review.isAnonymous && (
                  <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posted anonymously
                  </span>
                )}

                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ml-auto ${
                    review.rating >= 4
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : review.rating >= 3
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {review.rating}/5
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
