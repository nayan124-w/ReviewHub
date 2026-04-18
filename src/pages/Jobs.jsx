import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeJobs } from '../services/jobs';
import { saveJob, unsaveJob, getSavedJobs } from '../services/jobs';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Jobs = () => {
  const { user, isAuthenticated, isCompany } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [savingJob, setSavingJob] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeJobs((data) => {
      setJobs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !isCompany) {
      getSavedJobs(user.uid).then(setSavedJobs).catch(() => {});
    }
  }, [user, isCompany]);

  const handleSaveToggle = async (jobId) => {
    if (!isAuthenticated || isCompany) return;
    try {
      setSavingJob(jobId);
      if (savedJobs.includes(jobId)) {
        await unsaveJob(user.uid, jobId);
        setSavedJobs((prev) => prev.filter((id) => id !== jobId));
        toast.success('Job unsaved');
      } else {
        await saveJob(user.uid, jobId);
        setSavedJobs((prev) => [...prev, jobId]);
        toast.success('Job saved!');
      }
    } catch {
      toast.error('Failed to update saved jobs');
    } finally {
      setSavingJob(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const lower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      job.title?.toLowerCase().includes(lower) ||
      job.companyName?.toLowerCase().includes(lower) ||
      job.location?.toLowerCase().includes(lower);
    const matchesType = !filterType || job.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const jobTypeColors = {
    'Full-time': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
    'Part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/15',
    'Internship': 'bg-purple-500/10 text-purple-400 border-purple-500/15',
    'Contract': 'bg-amber-500/10 text-amber-400 border-amber-500/15',
    'Remote': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15',
  };

  return (
    <div className="page-container py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Portal</h1>
            <p className="text-sm text-slate-400">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {isCompany && (
            <Link to="/company/post-job" className="btn-primary self-start sm:self-auto">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post a Job
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-2xl p-4 sm:p-5 mb-8 slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs, companies, locations..."
              className="input-field !pl-10 !py-2.5 !text-sm !rounded-xl"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field !py-2.5 !px-3 !text-sm !rounded-xl sm:w-44"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <LoadingSpinner text="Loading jobs..." />
      ) : filteredJobs.length === 0 ? (
        <div className="glass rounded-2xl p-10 sm:p-14 text-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">No jobs found</h3>
          <p className="text-slate-500 text-sm">
            {searchTerm || filterType ? 'Try adjusting your search or filters.' : 'Check back later for new opportunities!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job, index) => (
            <div
              key={job.id}
              className="glass-light rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-white/10 hover:shadow-lg hover:shadow-black/10 fade-in"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-white mb-2">{job.title}</h3>

                  {/* Company & Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {job.companyName && (
                      <span className="text-xs font-medium text-primary-400 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {job.companyName}
                      </span>
                    )}
                    {job.type && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${jobTypeColors[job.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/15'}`}>
                        {job.type}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-3">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(job.createdAt)}
                    </span>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{job.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                  {job.applyLink && (
                    <a
                      href={job.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs !py-2 !px-4"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Apply Now
                    </a>
                  )}
                  {isAuthenticated && !isCompany && (
                    <button
                      onClick={() => handleSaveToggle(job.id)}
                      disabled={savingJob === job.id}
                      className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all duration-200 ${
                        savedJobs.includes(job.id)
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-white/5'
                      } disabled:opacity-50`}
                    >
                      {savedJobs.includes(job.id) ? '★ Saved' : '☆ Save'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔒 Monetization (Disabled by default) */}
      {/*
      <div className="glass rounded-2xl p-6 mt-8 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Boost Your Job Listing</h3>
        <p className="text-sm text-slate-400 mb-4">Get 5x more visibility with a featured listing</p>
        <button className="btn-premium">
          Boost Job (₹499)
        </button>
      </div>
      */}
    </div>
  );
};

export default Jobs;
