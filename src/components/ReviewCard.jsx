import { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { updateReview, deleteReview } from '../services/reviews';
import toast from 'react-hot-toast';

const ReviewCard = ({ review, currentUserId, onReviewChanged }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showProofImage, setShowProofImage] = useState(false);

  const isAuthor = currentUserId && review.userId === currentUserId;

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const startEdit = () => {
    setEditing(true);
    setEditText(review.description);
    setEditRating(review.rating);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditText('');
    setEditRating(0);
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      toast.error('Review text cannot be empty');
      return;
    }
    try {
      setActionInProgress(true);
      await updateReview(review.id, {
        description: editText.trim(),
        rating: editRating,
      });
      toast.success('Review updated!');
      setEditing(false);
      if (onReviewChanged) onReviewChanged();
    } catch (error) {
      toast.error(error.message || 'Failed to update review');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      setActionInProgress(true);
      await deleteReview(review.id);
      toast.success('Review deleted');
      if (onReviewChanged) onReviewChanged();
    } catch (error) {
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setActionInProgress(false);
    }
  };

  /* ── Proof display ── */
  const renderProof = () => {
    if (review.proofType === 'image' && review.proofUrl) {
      return (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowProofImage(!showProofImage)}
            className="text-xs text-emerald-400 flex items-center gap-1.5 hover:text-emerald-300 transition-colors duration-200 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showProofImage ? 'Hide proof image' : 'View proof image'}
          </button>
          {showProofImage && (
            <img
              src={review.proofUrl}
              alt="Review proof"
              className="mt-2.5 rounded-xl max-h-52 object-cover border border-white/10 shadow-lg shadow-black/20"
            />
          )}
        </div>
      );
    }
    if (review.proofType === 'text' && review.proofUrl) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-xs text-emerald-400/80 font-medium mb-1">Proof of employment:</p>
          <p className="text-xs text-slate-400 leading-relaxed">{review.proofUrl}</p>
        </div>
      );
    }
    return null;
  };

  /* ── Username display: clickable if NOT anonymous ── */
  const renderUserName = () => {
    if (review.isAnonymous) {
      return (
        <p className="text-sm font-semibold text-slate-200">Anonymous</p>
      );
    }

    return (
      <Link
        to={`/profile/${review.userId}`}
        className="text-sm font-semibold text-slate-200 hover:text-primary-300 transition-colors duration-200"
      >
        {review.userName || 'User'}
      </Link>
    );
  };

  return (
    <div className="glass-light rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-white/10 hover:shadow-lg hover:shadow-black/10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar — clickable if not anonymous */}
          {review.isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600/30 flex items-center justify-center text-sm font-bold text-slate-500">
              ?
            </div>
          ) : (
            <Link
              to={`/profile/${review.userId}`}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300 hover:border-primary-500/40 hover:shadow-md hover:shadow-primary-500/10 transition-all duration-200"
            >
              {review.userName?.charAt(0)?.toUpperCase() || 'U'}
            </Link>
          )}
          <div>
            {renderUserName()}
            <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={editing ? editRating : review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="text-base font-semibold text-white mb-2">{review.title}</h4>
      )}

      {/* Description — Edit or Read mode */}
      {editing ? (
        <div className="space-y-3 mt-3">
          {/* Star picker */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setEditRating(star)}
                className="transition-transform duration-150 hover:scale-125"
              >
                <svg
                  className={`w-6 h-6 ${star <= editRating ? 'text-amber-400' : 'text-slate-600'} transition-colors duration-150`}
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
              onClick={saveEdit}
              disabled={actionInProgress}
              className="btn-primary text-xs !py-1.5 !px-4 disabled:opacity-50"
            >
              {actionInProgress ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={cancelEdit}
              className="text-xs text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 leading-relaxed">{review.description}</p>
      )}

      {/* Proof display */}
      {!editing && renderProof()}

      {/* Footer: badges + actions */}
      <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-white/5">
        {/* Proof verification badge */}
        {(review.proofType === 'image' || review.proofType === 'text') && review.proofUrl ? (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        ) : (
          <span className="text-xs text-amber-400/70 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/5 border border-amber-500/10">
            ⚠️ Source not verified
          </span>
        )}

        {/* Author actions */}
        {isAuthor && !editing && (
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={startEdit}
              disabled={actionInProgress}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors duration-200 font-medium px-2.5 py-1 rounded-lg hover:bg-primary-500/10 disabled:opacity-50"
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={actionInProgress}
              className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200 font-medium px-2.5 py-1 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
            >
              {actionInProgress ? 'Deleting…' : '🗑️ Delete'}
            </button>
          </div>
        )}

        {/* Rating badge */}
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ml-auto ${
            review.rating >= 4
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : review.rating >= 3
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}
        >
          {review.rating >= 4 ? '👍 Positive' : review.rating >= 3 ? '😐 Neutral' : '👎 Negative'}
        </span>
      </div>
    </div>
  );
};

export default ReviewCard;
