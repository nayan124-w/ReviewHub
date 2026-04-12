import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCompanyById } from '../services/companies';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';

const BrowseReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Enrich with company names
      const enriched = await Promise.all(
        raw.map(async (review) => {
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
  }, []);

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

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mb-8 slide-up">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Reviews</h1>
        <p className="text-sm text-slate-400">
          All reviews from our community, sorted by most recent
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading reviews..." />
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 sm:p-12 text-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">No reviews yet</h3>
          <p className="text-slate-500 mb-6 text-sm">Be the first to share your experience!</p>
          <Link to="/" className="btn-primary">Explore Companies</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="glass-light rounded-xl p-5 fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300">
                    {review.isAnonymous ? '?' : review.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {review.isAnonymous ? 'Anonymous' : review.userName || 'User'}
                    </p>
                    <Link
                      to={`/company/${review.companyId}`}
                      className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      {review.companyName}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
                  <StarRating rating={review.rating} size="sm" />
                </div>
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="text-base font-semibold text-white mb-2">{review.title}</h4>
              )}

              {/* Description */}
              <p className="text-sm text-slate-400 leading-relaxed">{review.description}</p>

              {/* Proof Badge */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                {review.proofType === 'image' && review.proofUrl ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Verified with proof
                  </span>
                ) : review.proofType === 'text' && review.proofUrl ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Verified with proof
                  </span>
                ) : (
                  <span className="text-xs text-amber-400/70 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/5 border border-amber-500/10">
                    ⚠️ Source not verified
                  </span>
                )}

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ml-auto ${
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

export default BrowseReviews;
