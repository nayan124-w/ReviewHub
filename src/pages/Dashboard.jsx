import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeReviewsByUser } from '../services/reviews';
import { getCompanyById } from '../services/companies';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Real-time subscription to user's reviews ── */
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeReviewsByUser(user.uid, async (rawReviews) => {
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

  /* Rating distribution for mini chart */
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  return (
    <div className="page-container py-8 sm:py-12">
      {/* ── Profile Card ── */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 slide-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary-500/25 flex-shrink-0">
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1 truncate">
              {user?.displayName || 'User'}
            </h1>
            <p className="text-slate-400 text-sm mb-3 truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-medium text-slate-400 px-3 py-1 rounded-full glass-light inline-flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Member since {getMemberYear()}
              </span>
              {userProfile?.college && (
                <span className="text-xs font-medium text-primary-400 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 inline-flex items-center gap-1.5">
                  🎓 {userProfile.college}
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
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

        {/* Mini rating distribution */}
        {reviews.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Your Rating Distribution</p>
            <div className="flex items-end gap-2 h-12">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary-500/40 to-primary-400/20 transition-all duration-500"
                    style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0px' }}
                  />
                  <span className="text-[10px] text-slate-500">{star}★</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Reviews Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Your Reviews</h2>
          <p className="text-xs text-slate-500 mt-1">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/" className="btn-secondary text-sm self-start sm:self-auto">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Companies
        </Link>
      </div>

      {/* ── Reviews List ── */}
      {loading ? (
        <LoadingSpinner text="Loading your reviews..." />
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 sm:p-14 text-center fade-in">
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
        <div className="space-y-5">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Company name badge */}
              <Link
                to={`/company/${review.companyId}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200 mb-2 px-2.5 py-1 rounded-full bg-primary-500/5 border border-primary-500/10 hover:border-primary-500/20"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {review.companyName}
              </Link>
              <ReviewCard review={review} currentUserId={user?.uid} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
