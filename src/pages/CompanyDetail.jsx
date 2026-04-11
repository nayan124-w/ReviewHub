import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { subscribeCompanyById } from '../services/companies';
import { subscribeReviewsByCompany } from '../services/reviews';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ShareButton from '../components/ShareButton';

const industryIcons = {
  Technology: '💻',
  Finance: '💰',
  Healthcare: '🏥',
  Education: '📚',
  Retail: '🛍️',
  Manufacturing: '🏭',
  Marketing: '📢',
  Consulting: '🤝',
  'Real Estate': '🏢',
  Other: '🏛️',
};

const CompanyDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Real-time subscription to company + its reviews ── */
  useEffect(() => {
    if (!id) return;

    let companyLoaded = false;
    let reviewsLoaded = false;
    const markReady = () => {
      if (companyLoaded && reviewsLoaded) setLoading(false);
    };

    // Subscribe to company document
    const unsubCompany = subscribeCompanyById(id, (data) => {
      if (!data) {
        navigate('/');
        return;
      }
      setCompany(data);
      companyLoaded = true;
      markReady();
    });

    // Subscribe to reviews for this company
    const unsubReviews = subscribeReviewsByCompany(id, (data) => {
      setReviews(data);
      reviewsLoaded = true;
      markReady();
    });

    return () => {
      unsubCompany();
      unsubReviews();
    };
  }, [id, navigate]);

  const hasReviewed = user ? reviews.some((r) => r.userId === user.uid) : false;

  if (loading) {
    return <LoadingSpinner text="Loading company details..." />;
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-2">Company not found</h2>
        <p className="text-slate-500 mb-6 text-sm">This company may have been removed.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  /* ── Rating distribution bars ── */
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="page-container py-8 sm:py-12">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Companies
      </Link>

      {/* ── Company Header Card ── */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-8 slide-up">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/15 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
            {industryIcons[company.industry] || '🏛️'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 break-words">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="text-xs sm:text-sm text-primary-400 font-medium px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/15">
                {company.industry}
              </span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {company.location}
              </span>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs sm:text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Website
                </a>
              )}
            </div>
            {company.description && (
              <p className="text-slate-400 text-sm leading-relaxed">{company.description}</p>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex-shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-2.5 mt-2 sm:mt-0">
            {isAuthenticated && !hasReviewed ? (
              <Link
                to={`/add-review/${company.id}`}
                className="btn-primary w-full sm:w-auto"
                id="write-review-button"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Write a Review
              </Link>
            ) : hasReviewed ? (
              <span className="text-sm text-emerald-400 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You've reviewed this company
              </span>
            ) : !isAuthenticated ? (
              <Link to="/login" className="btn-secondary text-sm">
                Log in to review
              </Link>
            ) : null}
            <ShareButton
              title={`${company.name} Reviews — ReviewHub`}
              text={`Check out reviews for ${company.name} on ReviewHub!`}
              url={window.location.href}
            />
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Rating Summary Sidebar */}
        <div className="lg:col-span-1 order-1">
          <div className="glass rounded-2xl p-6 lg:sticky lg:top-24">
            <h3 className="text-lg font-bold text-white mb-5">Rating Summary</h3>

            {/* Big Rating */}
            <div className="text-center mb-6 pb-6 border-b border-white/5">
              <p className="text-5xl font-black text-white mb-2">
                {company.averageRating ? company.averageRating.toFixed(1) : '—'}
              </p>
              <div className="flex justify-center mb-2">
                <StarRating rating={Math.round(company.averageRating || 0)} size="lg" />
              </div>
              <p className="text-sm text-slate-500">
                Based on {company.totalReviews || 0} review{(company.totalReviews || 0) !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Distribution Bars */}
            <div className="space-y-3">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2.5">
                  <span className="text-sm text-slate-400 w-3 text-right font-medium">{star}</span>
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-6 text-right tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 order-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Reviews ({reviews.length})
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-10 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">No reviews yet</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Be the first to share your experience at {company.name}
              </p>
              {isAuthenticated && company.id && (
                <Link to={`/add-review/${company.id}`} className="btn-primary">
                  Write the First Review
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div key={review.id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
