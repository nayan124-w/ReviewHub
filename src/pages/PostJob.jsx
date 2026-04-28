import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createJob } from '../services/jobs';
import toast from 'react-hot-toast';

const PostJob = () => {
  const { user, companyProfile, isCompany } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    location: '',
    type: 'Full-time',
    applyLink: '',
    durationDays: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!formData.applyLink.trim()) {
      toast.error('Application link is required');
      return;
    }

    const jobPayload = {
      companyId: user.uid,
      companyName: companyProfile?.name || 'Unknown Company',
      title: formData.title.trim(),
      description: formData.description.trim(),
      salary: formData.salary.trim(),
      location: formData.location.trim() || companyProfile?.location || '',
      type: formData.type,
      applyLink: formData.applyLink.trim(),
      durationDays: formData.durationDays ? Number(formData.durationDays) : null,
    };

    // 🔥 DEBUG LOGGING
    console.log('[PostJob] User role: company');
    console.log('[PostJob] Job payload:', jobPayload);

    try {
      setLoading(true);
      await createJob(jobPayload);
      toast.success('Job posted successfully! 🎉');
      navigate('/company/dashboard');
    } catch (error) {
      console.error('[PostJob] Error:', error);
      toast.error(error.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  if (!isCompany) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Company access only</h2>
        <p className="text-slate-400 mb-6 text-sm">Only company accounts can post jobs.</p>
        <Link to="/company/login" className="btn-primary">Company Login</Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-12">
      <Link
        to="/company/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-6 sm:p-8 slide-up">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Post a Job</h1>
            <p className="text-sm text-slate-400 mt-1">as <span className="text-primary-400 font-medium">{companyProfile?.name}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Job Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field resize-none"
                rows={4}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Salary Range</label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. ₹8-12 LPA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Bangalore, Remote"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Apply Link <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                name="applyLink"
                value={formData.applyLink}
                onChange={handleChange}
                className="input-field"
                placeholder="https://careers.yourcompany.com/apply"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vacancy Duration <span className="text-slate-500 font-normal">(days, optional)</span>
              </label>
              <input
                type="number"
                name="durationDays"
                min="1"
                value={formData.durationDays}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 30 — leave empty for no expiry"
              />
              <p className="text-xs text-slate-500 mt-1">
                Job will auto-expire after this many days. Leave empty for no expiry.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Job
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 🔒 Monetization (Disabled by default) */}
      {/*
      <div className="max-w-2xl mx-auto mt-6">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-3">Want more visibility?</p>
          <button className="btn-premium">
            Boost Job (₹499)
          </button>
        </div>
      </div>
      */}
    </div>
  );
};

export default PostJob;
