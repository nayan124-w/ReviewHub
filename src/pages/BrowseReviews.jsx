import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCompanyById, getCompanies } from '../services/companies';
import { getUserProfile, getUniqueColleges } from '../services/auth';
import ReviewCard from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const BrowseReviews = () => {
  const { user, userProfile } = useAuth();

  /* ── Data state ── */
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [collegeMap, setCollegeMap] = useState({});

  /* ── Filter state ── */
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [sameCollege, setSameCollege] = useState(false);
  const [sortBy, setSortBy] = useState('latest'); // latest | oldest | high | low

  /* ── Fetch companies + colleges on mount ── */
  useEffect(() => {
    getUniqueColleges().then(setColleges).catch(() => {});
    getCompanies().then(setCompanies).catch(() => {});
  }, []);

  /* ── Real-time reviews subscription ── */
  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Enrich with company names + user colleges
      const userCache = { ...collegeMap };
      const enriched = await Promise.all(
        raw.map(async (review) => {
          let companyName = 'Unknown Company';
          try {
            const company = await getCompanyById(review.companyId);
            companyName = company?.name || 'Unknown Company';
          } catch {}

          let userCollege = userCache[review.userId];
          if (userCollege === undefined) {
            try {
              const profile = await getUserProfile(review.userId);
              userCollege = profile?.college || '';
              userCache[review.userId] = userCollege;
            } catch {
              userCollege = '';
              userCache[review.userId] = '';
            }
          }

          return { ...review, companyName, userCollege };
        })
      );

      setCollegeMap(userCache);
      setAllReviews(enriched);
      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Filtered + sorted reviews ── */
  const filteredReviews = useMemo(() => {
    let results = [...allReviews];

    // Company filter
    if (selectedCompany) {
      results = results.filter((r) => r.companyId === selectedCompany);
    }

    // College filter (dropdown)
    if (selectedCollege) {
      results = results.filter((r) => r.userCollege === selectedCollege);
    }

    // Same college filter
    if (sameCollege && userProfile?.college) {
      results = results.filter((r) => r.userCollege === userProfile.college);
    }

    // Sorting
    switch (sortBy) {
      case 'latest':
        results.sort((a, b) => {
          const aT = a.createdAt?.seconds || 0;
          const bT = b.createdAt?.seconds || 0;
          return bT - aT;
        });
        break;
      case 'oldest':
        results.sort((a, b) => {
          const aT = a.createdAt?.seconds || 0;
          const bT = b.createdAt?.seconds || 0;
          return aT - bT;
        });
        break;
      case 'high':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'low':
        results.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return results;
  }, [allReviews, selectedCompany, selectedCollege, sameCollege, sortBy, userProfile]);

  const hasActiveFilters = selectedCompany || selectedCollege || sameCollege || sortBy !== 'latest';

  const clearAllFilters = () => {
    setSelectedCompany('');
    setSelectedCollege('');
    setSameCollege(false);
    setSortBy('latest');
  };

  return (
    <div className="page-container py-8 sm:py-12">
      {/* ── Header ── */}
      <div className="mb-6 slide-up">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Reviews</h1>
        <p className="text-sm text-slate-400">
          {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} from our community
        </p>
      </div>

      {/* ━━━ FILTER BAR ━━━ */}
      <div className="glass rounded-2xl p-4 sm:p-5 mb-8 slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Company filter */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              🏢 Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="input-field !py-2 !px-3 !text-sm !rounded-xl"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* College filter */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              🎓 College
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                if (e.target.value) setSameCollege(false);
              }}
              disabled={sameCollege}
              className="input-field !py-2 !px-3 !text-sm !rounded-xl disabled:opacity-40"
            >
              <option value="">All Colleges</option>
              {colleges.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort by */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              ↕️ Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field !py-2 !px-3 !text-sm !rounded-xl"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="high">Rating: High → Low</option>
              <option value="low">Rating: Low → High</option>
            </select>
          </div>

          {/* Same College toggle + Clear */}
          <div className="flex items-end gap-2 flex-shrink-0">
            {userProfile?.college && (
              <button
                onClick={() => {
                  setSameCollege(!sameCollege);
                  if (!sameCollege) setSelectedCollege('');
                }}
                className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all duration-200 whitespace-nowrap ${
                  sameCollege
                    ? 'border-primary-500 bg-primary-500/15 text-primary-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-white/5'
                }`}
              >
                🏫 My College
              </button>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-2 rounded-xl border border-red-500/15 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-200 whitespace-nowrap"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Active filter badges ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 fade-in">
          {selectedCompany && (
            <span className="text-xs font-medium text-primary-400 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 flex items-center gap-1.5">
              🏢 {companies.find((c) => c.id === selectedCompany)?.name || 'Company'}
              <button onClick={() => setSelectedCompany('')} className="text-primary-300 hover:text-white transition-colors">✕</button>
            </span>
          )}
          {selectedCollege && (
            <span className="text-xs font-medium text-primary-400 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 flex items-center gap-1.5">
              🎓 {selectedCollege}
              <button onClick={() => setSelectedCollege('')} className="text-primary-300 hover:text-white transition-colors">✕</button>
            </span>
          )}
          {sameCollege && userProfile?.college && (
            <span className="text-xs font-medium text-primary-400 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 flex items-center gap-1.5">
              🏫 {userProfile.college}
              <button onClick={() => setSameCollege(false)} className="text-primary-300 hover:text-white transition-colors">✕</button>
            </span>
          )}
          {sortBy !== 'latest' && (
            <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-800/50 border border-white/5">
              ↕️ {sortBy === 'oldest' ? 'Oldest' : sortBy === 'high' ? 'High → Low' : 'Low → High'}
            </span>
          )}
          <span className="text-xs text-slate-500 ml-1">
            {filteredReviews.length} result{filteredReviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── Reviews List ── */}
      {loading ? (
        <LoadingSpinner text="Loading reviews..." />
      ) : filteredReviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 sm:p-14 text-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">
            {hasActiveFilters ? 'No reviews match your filters' : 'No reviews yet'}
          </h3>
          <p className="text-slate-500 mb-6 text-sm">
            {hasActiveFilters ? 'Try adjusting your filters or clear them.' : 'Be the first to share your experience!'}
          </p>
          {hasActiveFilters ? (
            <button onClick={clearAllFilters} className="btn-secondary">
              Clear All Filters
            </button>
          ) : (
            <Link to="/" className="btn-primary">Explore Companies</Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredReviews.map((review, index) => (
            <div
              key={review.id}
              className="fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* Company + College badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Link
                  to={`/company/${review.companyId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200 px-2.5 py-1 rounded-full bg-primary-500/5 border border-primary-500/10 hover:border-primary-500/20"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {review.companyName}
                </Link>
                {review.userCollege && (
                  <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-800/50 border border-white/5">
                    🎓 {review.userCollege}
                  </span>
                )}
              </div>
              <ReviewCard review={review} currentUserId={user?.uid} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseReviews;
