import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateCompanyProfile } from '../services/companyAuth';
import { deleteJob, subscribeJobsByCompany, updateJob } from '../services/jobs';
import { sanitizeReviewsForCompany } from '../services/privacy';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { addCompanyReply, deleteCompanyReply } from '../services/reviews';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CompanyDashboard = () => {
  const { user, companyProfile, isCompany, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // overview | reviews | jobs | profile
  const [reviews, setReviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkedCompanyIds, setLinkedCompanyIds] = useState([]);

  // Job editing state
  const [editingJobId, setEditingJobId] = useState(null);
  const [editJobForm, setEditJobForm] = useState({});

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  /* ──────────────────────────────────────────────
     STEP 1: Find company docs in 'companies' collection
     that match this company's name.
     Then subscribe to reviews for those IDs.
     ────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated || !isCompany) {
      navigate('/company/login');
      return;
    }

    if (!companyProfile?.name) {
      setLoading(false);
      return;
    }

    let unsubReviews = null;

    const init = async () => {
      // Find all companies in the 'companies' collection matching this company name
      const compQ = query(
        collection(db, 'companies'),
        where('name', '==', companyProfile.name)
      );
      const compSnap = await getDocs(compQ);
      const compIds = compSnap.docs.map((d) => d.id);
      setLinkedCompanyIds(compIds);

      if (compIds.length === 0) {
        // No linked companies yet — still listen for reviews in case they appear
        setReviews([]);
        setLoading(false);
        return;
      }

      // Subscribe to reviews for these company IDs
      // Firestore 'in' queries support up to 30 values
      const reviewQ = query(
        collection(db, 'reviews'),
        where('companyId', 'in', compIds.slice(0, 30)),
        orderBy('createdAt', 'desc')
      );

      unsubReviews = onSnapshot(reviewQ, (snapshot) => {
        const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // 🔒 PRIVACY: Sanitize reviews — strip ALL user identity
        const sanitized = sanitizeReviewsForCompany(raw);
        setReviews(sanitized);
        setLoading(false);
      });
    };

    init().catch(() => setLoading(false));

    // Subscribe to jobs
    const unsubJobs = subscribeJobsByCompany(user.uid, setJobs);

    return () => {
      if (unsubReviews) unsubReviews();
      unsubJobs();
    };
  }, [isAuthenticated, isCompany, companyProfile, user, navigate]);

  useEffect(() => {
    if (companyProfile) {
      setProfileForm({
        name: companyProfile.name || '',
        about: companyProfile.about || '',
        industry: companyProfile.industry || '',
        location: companyProfile.location || '',
        website: companyProfile.website || '',
        founded: companyProfile.founded || '',
        size: companyProfile.size || '',
      });
    }
  }, [companyProfile]);

  const handleProfileUpdate = async () => {
    try {
      setSubmitting(true);
      await updateCompanyProfile(user.uid, profileForm);
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      await addCompanyReply(reviewId, replyText);
      toast.success('Reply posted!');
      setReplyingTo(null);
      setReplyText('');
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await deleteCompanyReply(reviewId);
      toast.success('Reply deleted');
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;
    try {
      await deleteJob(jobId);
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const startEditingJob = (job) => {
    setEditingJobId(job.id);
    setEditJobForm({
      title: job.title || '',
      description: job.description || '',
      salary: job.salary || '',
      location: job.location || '',
      type: job.type || 'Full-time',
      applyLink: job.applyLink || '',
      durationDays: job.durationDays || '',
    });
  };

  const cancelEditingJob = () => {
    setEditingJobId(null);
    setEditJobForm({});
  };

  const handleUpdateJob = async (jobId) => {
    if (!editJobForm.title?.trim()) {
      toast.error('Job title is required');
      return;
    }
    try {
      setSubmitting(true);
      const updates = { ...editJobForm };

      // Compute expiresAt from durationDays
      if (updates.durationDays && Number(updates.durationDays) > 0) {
        updates.durationDays = Number(updates.durationDays);
        updates.expiresAt = new Date(Date.now() + updates.durationDays * 24 * 60 * 60 * 1000);
      } else {
        // Remove expiry if no duration set
        updates.durationDays = null;
        updates.expiresAt = null;
      }

      await updateJob(jobId, updates);
      toast.success('Job updated!');
      setEditingJobId(null);
      setEditJobForm({});
    } catch {
      toast.error('Failed to update job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Failed to log out');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ── Computed stats ── */
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : companyProfile?.averageRating?.toFixed(1) || '—';

  if (!isCompany) return null;
  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'jobs', label: 'Jobs', icon: '💼' },
    { id: 'profile', label: 'Profile', icon: '🏢' },
  ];

  return (
    <div className="page-container py-8 sm:py-12">
      {/* Header */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-8 slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-emerald-500/25">
              {companyProfile?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{companyProfile?.name || 'Company'}</h1>
              <div className="flex items-center gap-3 mt-1">
                {companyProfile?.industry && (
                  <span className="text-xs text-emerald-400 font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                    {companyProfile.industry}
                  </span>
                )}
                {companyProfile?.location && (
                  <span className="text-xs text-slate-400">{companyProfile.location}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/company/post-job" className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Job
            </Link>
            <button onClick={handleLogout} className="btn-secondary text-sm !text-red-400 !border-red-500/15 hover:!bg-red-500/10">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{reviews.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{avgRating}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{jobs.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active Jobs</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 fade-in">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">🔒 Privacy Notice</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              ReviewHub enforces strict privacy. Reviewer identities (names, emails, colleges) are 
              <strong className="text-amber-400"> never visible</strong> to companies. You can view and reply 
              to reviews, but you will only see ratings, descriptions, dates, and proof of employment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Total Reviews</h3>
              <p className="text-3xl font-bold text-white">{reviews.length}</p>
              <p className="text-xs text-slate-500 mt-1">Reviews received for your company</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Average Rating</h3>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-amber-400">{avgRating}</p>
                <StarRating rating={Math.round(parseFloat(avgRating) || 0)} size="sm" />
              </div>
            </div>
          </div>

          {/* Rating distribution */}
          {reviews.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Rating Distribution</h3>
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400 w-3 text-right font-medium">{star}</span>
                      <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="flex-1 h-2 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-6 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent reviews preview */}
          {reviews.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Latest Reviews</h3>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="glass-light rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700/50 border border-slate-600/30 flex items-center justify-center text-[10px] text-slate-500">
                          🔒
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{review.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4 fade-in">
          <h2 className="text-xl font-bold text-white mb-4">
            Reviews ({reviews.length})
            <span className="text-xs text-slate-500 font-normal ml-2">Reviewer identities are hidden</span>
          </h2>
          
          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">No reviews yet</h3>
              <p className="text-slate-500 text-sm">
                {linkedCompanyIds.length === 0
                  ? 'Your company hasn\'t been added to the review directory yet. Reviews will appear once users add and review your company.'
                  : 'Reviews will appear here as users submit them.'}
              </p>
            </div>
          ) : (
            reviews.map((review, i) => (
              <div
                key={review.id}
                className="glass-light rounded-2xl p-5 sm:p-6 fade-in"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {/* 🔒 PRIVACY: No user info shown — always "Anonymous Reviewer" */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600/30 flex items-center justify-center text-sm text-slate-500">
                      🔒
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Anonymous Reviewer</p>
                      <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                
                {review.title && <h4 className="text-base font-semibold text-white mb-2">{review.title}</h4>}
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{review.description}</p>

                {/* Proof badge */}
                {review.proofType && review.proofUrl ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 w-fit mb-3">
                    ✅ Verified
                  </span>
                ) : (
                  <span className="text-xs text-amber-400/70 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 w-fit mb-3">
                    ⚠️ Source not verified
                  </span>
                )}

                {/* Helpful count (read-only for companies) */}
                {(review.helpful || 0) > 0 && (
                  <span className="text-xs text-slate-500 mb-3 inline-block">
                    👍 {review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this helpful
                  </span>
                )}

                {/* Company Reply */}
                {review.companyReply && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-xs text-emerald-400/80 font-medium mb-1">🏢 Your Reply:</p>
                    <p className="text-sm text-slate-300">{review.companyReply}</p>
                    {review.companyReplyAt && (
                      <p className="text-[10px] text-slate-500 mt-1">{formatDate(review.companyReplyAt)}</p>
                    )}
                    <button
                      onClick={() => handleDeleteReply(review.id)}
                      className="text-xs text-red-400 hover:text-red-300 mt-2 transition-colors"
                    >
                      Delete Reply
                    </button>
                  </div>
                )}

                {/* Reply Form */}
                {!review.companyReply && (
                  <div className="mt-3">
                    {replyingTo === review.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a professional response..."
                          rows={3}
                          className="input-field resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(review.id)}
                            disabled={submitting || !replyText.trim()}
                            className="btn-primary text-xs !py-1.5 !px-4 disabled:opacity-50"
                          >
                            {submitting ? 'Posting...' : 'Post Reply'}
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all"
                      >
                        💬 Reply to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Job Postings ({jobs.length})</h2>
            <Link to="/company/post-job" className="btn-primary text-sm">Post New Job</Link>
          </div>
          
          {jobs.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 mb-4">No jobs posted yet.</p>
              <Link to="/company/post-job" className="btn-primary">Post Your First Job</Link>
            </div>
          ) : (
            jobs.map((job, i) => {
              const isExpired = job.expiresAt && (
                (job.expiresAt.seconds ? new Date(job.expiresAt.seconds * 1000) : new Date(job.expiresAt)) < new Date()
              );
              return (
                <div
                  key={job.id}
                  className={`glass-light rounded-2xl p-5 fade-in ${isExpired ? 'opacity-60' : ''}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {editingJobId === job.id ? (
                    /* ── EDIT MODE ── */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Job Title *</label>
                        <input
                          type="text"
                          value={editJobForm.title}
                          onChange={(e) => setEditJobForm({ ...editJobForm, title: e.target.value })}
                          className="input-field !text-sm"
                          placeholder="Job title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                        <textarea
                          value={editJobForm.description}
                          onChange={(e) => setEditJobForm({ ...editJobForm, description: e.target.value })}
                          className="input-field resize-none !text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Salary</label>
                          <input
                            type="text"
                            value={editJobForm.salary}
                            onChange={(e) => setEditJobForm({ ...editJobForm, salary: e.target.value })}
                            className="input-field !text-sm"
                            placeholder="e.g. ₹8-12 LPA"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                          <input
                            type="text"
                            value={editJobForm.location}
                            onChange={(e) => setEditJobForm({ ...editJobForm, location: e.target.value })}
                            className="input-field !text-sm"
                            placeholder="e.g. Bangalore"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Job Type</label>
                          <select
                            value={editJobForm.type}
                            onChange={(e) => setEditJobForm({ ...editJobForm, type: e.target.value })}
                            className="input-field !text-sm"
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Internship">Internship</option>
                            <option value="Contract">Contract</option>
                            <option value="Remote">Remote</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Vacancy Duration (days)</label>
                          <input
                            type="number"
                            min="0"
                            value={editJobForm.durationDays}
                            onChange={(e) => setEditJobForm({ ...editJobForm, durationDays: e.target.value })}
                            className="input-field !text-sm"
                            placeholder="e.g. 30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Apply Link</label>
                        <input
                          type="url"
                          value={editJobForm.applyLink}
                          onChange={(e) => setEditJobForm({ ...editJobForm, applyLink: e.target.value })}
                          className="input-field !text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateJob(job.id)}
                          disabled={submitting}
                          className="btn-primary text-xs !py-1.5 !px-4 disabled:opacity-50"
                        >
                          {submitting ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button
                          onClick={cancelEditingJob}
                          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── VIEW MODE ── */
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          {job.location && <span>📍 {job.location}</span>}
                          {job.salary && <span>💰 {job.salary}</span>}
                          {job.type && <span>{job.type}</span>}
                          {job.durationDays && (
                            <span className="text-primary-400">
                              ⏱ {job.durationDays}d vacancy
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-slate-500">{formatDate(job.createdAt)}</p>
                          {isExpired && (
                            <span className="text-[10px] font-semibold text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/15">
                              EXPIRED
                            </span>
                          )}
                          {job.expiresAt && !isExpired && (
                            <span className="text-[10px] font-medium text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEditingJob(job)}
                          className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto fade-in">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Company Profile</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                  ✏️ Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Company Name', type: 'text' },
                  { key: 'about', label: 'About', type: 'textarea' },
                  { key: 'industry', label: 'Industry', type: 'text' },
                  { key: 'location', label: 'Location', type: 'text' },
                  { key: 'website', label: 'Website', type: 'url' },
                  { key: 'founded', label: 'Founded Year', type: 'text' },
                  { key: 'size', label: 'Company Size', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        value={profileForm[key] || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        className="input-field resize-none"
                        rows={3}
                      />
                    ) : (
                      <input
                        type={type}
                        value={profileForm[key] || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'About', value: companyProfile?.about },
                  { label: 'Industry', value: companyProfile?.industry },
                  { label: 'Location', value: companyProfile?.location },
                  { label: 'Website', value: companyProfile?.website, isLink: true },
                  { label: 'Founded', value: companyProfile?.founded },
                  { label: 'Size', value: companyProfile?.size },
                ].map(({ label, value, isLink }) => (
                  <div key={label} className="py-3 border-b border-white/5 last:border-0">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
                    {isLink && value ? (
                      <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:text-primary-300">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-300">{value || '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔒 Monetization (Disabled by default) */}
      {/*
      <div className="glass rounded-2xl p-6 mt-8 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Premium Company Features</h3>
        <p className="text-sm text-slate-400 mb-4">Get featured on the homepage and unlock premium badge</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-premium">
            Featured Listing (₹999/mo)
          </button>
          <button className="btn-premium">
            Premium Badge (₹1999/qtr)
          </button>
        </div>
      </div>
      */}
    </div>
  );
};

export default CompanyDashboard;
