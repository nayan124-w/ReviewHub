import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile } from '../services/auth';
import { getReviewsByUser } from '../services/reviews';
import { getCompanyById } from '../services/companies';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import LoadingSpinner from '../components/LoadingSpinner';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getUserProfile(userId);
        if (!profileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // Fetch user's non-anonymous reviews
        const rawReviews = await getReviewsByUser(userId);
        const publicReviews = rawReviews.filter((r) => !r.isAnonymous);

        // Enrich with company names
        const enriched = await Promise.all(
          publicReviews.map(async (review) => {
            try {
              const company = await getCompanyById(review.companyId);
              return { ...review, companyName: company?.name || 'Unknown Company' };
            } catch {
              return { ...review, companyName: 'Unknown Company' };
            }
          })
        );
        setReviews(enriched);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const getMemberYear = () => {
    if (!profile?.createdAt) return '—';
    if (profile.createdAt.seconds) {
      return new Date(profile.createdAt.seconds * 1000).getFullYear();
    }
    return new Date(profile.createdAt).getFullYear();
  };

  const maskedEmail = () => {
    if (!profile?.email) return '';
    const [local, domain] = profile.email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}${'•'.repeat(Math.min(local.length - 2, 6))}@${domain}`;
  };

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  if (notFound) {
    return (
      <div className="page-container py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-2">User not found</h2>
        <p className="text-slate-500 mb-6 text-sm">This profile doesn't exist or has been removed.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-12">
      {/* Back */}
      <Link
        to="/reviews"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors duration-200 mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reviews
      </Link>

      {/* ── Profile Card ── */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 slide-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary-500/25 flex-shrink-0">
            {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {profile.displayName || 'User'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-3">
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full glass-light inline-flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {maskedEmail()}
              </span>
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full glass-light inline-flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Member since {getMemberYear()}
              </span>
              {profile.college && (
                <span className="text-xs font-medium text-primary-400 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 inline-flex items-center gap-1.5">
                  🎓 {profile.college}
                </span>
              )}
            </div>
          </div>

          {/* Stats + Message */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Public Reviews</p>
            </div>
            <div className="w-px h-10 bg-slate-700/50" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{avgRating}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Message button — only show if viewing someone else's profile and logged in */}
        {isAuthenticated && !isOwnProfile && (
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3">
            <Link
              to={`/chat/${userId}`}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send Message
            </Link>
            {isOwnProfile && (
              <Link to="/dashboard" className="btn-secondary text-sm">
                Edit Profile
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Reviews Section ── */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          {isOwnProfile ? 'Your Public Reviews' : `Reviews by ${profile.displayName}`}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {reviews.length} public review{reviews.length !== 1 ? 's' : ''}
          {isOwnProfile ? '' : ' · Anonymous reviews are hidden'}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 sm:p-14 text-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">No public reviews</h3>
          <p className="text-slate-500 text-sm">This user hasn't shared any public reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review, i) => (
            <div key={review.id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <Link
                to={`/company/${review.companyId}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200 mb-2 px-2.5 py-1 rounded-full bg-primary-500/5 border border-primary-500/10 hover:border-primary-500/20"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {review.companyName}
              </Link>
              <ReviewCard review={review} currentUserId={currentUser?.uid} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
