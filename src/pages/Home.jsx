import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeCompanies } from '../services/companies';
import { useAuth } from '../context/AuthContext';
import CompanyCard from '../components/CompanyCard';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── How-it-works steps ── */
const STEPS = [
  {
    n: 1,
    title: 'Create Account',
    desc: 'Sign up free with email — review anonymously if you prefer.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'Find a Company',
    desc: 'Search companies or add a new one yourself.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Write a Review',
    desc: 'Rate 1–5 stars, add a title and detailed feedback.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    n: 4,
    title: 'Help Others',
    desc: 'Your review helps others make better career choices.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
    ),
  },
];

const Home = () => {
  const { isAuthenticated, user, isCompany } = useAuth();
  const [allCompanies, setAllCompanies] = useState([]);   // live from Firestore
  const [companies, setCompanies] = useState([]);          // displayed (filtered or all)
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  /* ── Real-time subscription to all companies ── */
  useEffect(() => {
    const unsubscribe = subscribeCompanies((data) => {
      setAllCompanies(data);
      // If no active search, display all
      if (!searchTerm.trim()) {
        setCompanies(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-filter when allCompanies update during a search ── */
  useEffect(() => {
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      setCompanies(
        allCompanies.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.industry.toLowerCase().includes(lower) ||
            c.location.toLowerCase().includes(lower)
        )
      );
    }
  }, [allCompanies, searchTerm]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term.trim()) {
      setCompanies(allCompanies);
      return;
    }
    const lower = term.toLowerCase();
    setCompanies(
      allCompanies.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.industry.toLowerCase().includes(lower) ||
          c.location.toLowerCase().includes(lower)
      )
    );
  };

  const quickSearch = (v) => {
    setSearchTerm(v);
    handleSearch({ target: { value: v } });
  };

  /* ── Computed stats from real-time data ── */
  const totalReviews = allCompanies.reduce((a, c) => a + (c.totalReviews || 0), 0);
  const reviewedCompanies = allCompanies.filter((c) => (c.totalReviews || 0) > 0);
  const avgRating = reviewedCompanies.length
    ? (reviewedCompanies.reduce((a, c) => a + (c.averageRating || 0), 0) / reviewedCompanies.length).toFixed(1)
    : '—';

  /* ── Top-rated companies (featured) ── */
  const featuredCompanies = [...allCompanies]
    .filter((c) => c.totalReviews > 0)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 4);

  /* ── Trending companies (most reviews recently) ── */
  const trendingCompanies = [...allCompanies]
    .filter((c) => c.totalReviews > 0)
    .sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[380px] rounded-full bg-primary-600/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-[-40px] right-[-80px] w-[350px] h-[350px] rounded-full bg-accent-500/5 blur-[100px] pointer-events-none" />

        <div className="relative page-container text-center flex flex-col items-center pt-16 sm:pt-24 pb-20 sm:pb-28 slide-up">
          {/* Welcome badge */}
          {user ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light mb-8">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[9px] font-bold text-white">
                {user.displayName?.charAt(0)?.toUpperCase() || '✦'}
              </div>
              <span className="text-xs font-medium text-slate-300">
                Welcome back, {user.displayName || user.email}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
                Community-driven reviews
              </span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 max-w-3xl mx-auto">
            Discover What It's{' '}
            <span className="hero-gradient-text">Really Like</span>
            {' '}to Work Anywhere
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed mb-10 mx-auto">
            Honest, anonymous reviews from real employees. Make your next career move with confidence.
          </p>

          {/* Search */}
          <div className="w-full max-w-xl mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                id="search-input"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search companies, industries, locations…"
                className="input-field !pl-12 !py-3.5 !rounded-2xl text-sm shadow-lg shadow-black/20"
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              )}
            </div>
            <div className="text-xs text-slate-600 mt-2.5 flex gap-1.5 justify-center flex-wrap">
              <span>Popular:</span>
              {['Technology', 'Finance', 'Healthcare'].map((t) => (
                <button
                  key={t}
                  onClick={() => quickSearch(t)}
                  className="text-primary-400 hover:text-primary-300 hover:underline transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 sm:gap-12 mt-4">
            {[
              { val: allCompanies.length || '0', label: 'Companies' },
              { val: totalReviews || '0', label: 'Reviews' },
              { val: avgRating, label: 'Avg Rating', amber: true },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className={`text-2xl sm:text-3xl font-bold ${s.amber ? 'text-amber-400' : 'text-white'}`}>
                  {s.val}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/jobs" className="btn-secondary text-sm !py-2.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Browse Jobs
            </Link>
            {!isCompany && (
              <Link to="/company/login" className="btn-secondary text-sm !py-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                For Companies
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED COMPANIES ━━━ */}
      {featuredCompanies.length > 0 && (
        <section className="page-container pb-16 section-glow">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold text-primary-400 tracking-widest uppercase mb-2">
              Top Rated
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Featured <span className="hero-gradient-text">Companies</span>
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Highest-rated companies based on real employee reviews
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCompanies.map((c, i) => (
              <div key={c.id} className="fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━ TRENDING COMPANIES ━━━ */}
      {trendingCompanies.length > 0 && trendingCompanies.length !== featuredCompanies.length && (
        <section className="page-container pb-16 section-glow">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold text-amber-400 tracking-widest uppercase mb-2">
              🔥 Trending
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Most <span className="hero-gradient-text">Reviewed</span>
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Companies with the most community engagement
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingCompanies.map((c, i) => (
              <div key={c.id} className="fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="page-container py-20 section-glow">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase mb-2">
            Simple Process
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            How to Review a Company
          </h2>
          <p className="text-sm text-slate-400 mt-2">It takes less than 2 minutes</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-5 text-center card-hover relative">
              <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                {s.n}
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/15 to-accent-500/15 border border-primary-500/15 flex items-center justify-center text-primary-300 mx-auto mb-3">
                {s.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to={isAuthenticated ? '/add-company' : '/register'}
            className="btn-primary !px-8 !py-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isAuthenticated ? 'Write Your First Review' : 'Get Started — It\'s Free'}
          </Link>
        </div>
      </section>

      {/* ━━━ ALL COMPANIES ━━━ */}
      <section className="page-container pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">
              {searchTerm ? 'Search Results' : 'All Companies'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {searchTerm
                ? `${companies.length} result${companies.length !== 1 ? 's' : ''}`
                : 'Browse companies added by our community'}
            </p>
          </div>
          {isAuthenticated && !isCompany && (
            <Link to="/add-company" className="btn-primary text-xs !py-2 !px-4 self-start sm:self-auto">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Company
            </Link>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text="Loading companies..." />
        ) : companies.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <div className="w-16 h-16 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">
              {searchTerm ? 'No companies found' : 'No companies yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {searchTerm ? 'Try a different search term' : 'Be the first to add one!'}
            </p>
            {isAuthenticated && !searchTerm && (
              <Link to="/add-company" className="btn-primary">
                Add the First Company
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c, i) => (
              <div key={c.id} className="fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ━━━ CTA BANNER ━━━ */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[280px] h-[180px] bg-primary-500/10 blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to Share Your Experience?
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
              Join our community and help others make better career decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={isAuthenticated ? '/add-company' : '/register'}
                className="btn-primary !px-7 !py-3"
              >
                {isAuthenticated ? 'Add a Company' : 'Create Free Account'}
              </Link>
              <Link to="/reviews" className="btn-secondary !px-7 !py-3">
                Browse Reviews
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
