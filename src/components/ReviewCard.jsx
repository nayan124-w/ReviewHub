import StarRating from './StarRating';

const ReviewCard = ({ review }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="glass-light rounded-xl p-5 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300">
            {review.isAnonymous ? '?' : review.userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {review.isAnonymous ? 'Anonymous' : review.userName || 'User'}
            </p>
            <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold text-white mb-2">{review.title}</h4>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed">{review.description}</p>

      {/* Rating Badge */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
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
