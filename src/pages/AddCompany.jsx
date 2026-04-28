import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addCompany } from '../services/companies';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Marketing',
  'Consulting',
  'Real Estate',
  'Other',
];

const AddCompany = () => {
  const { user, isCompany } = useAuth();
  const navigate = useNavigate();

  // 🔒 ROLE GUARD: Company accounts cannot add companies
  if (isCompany) {
    return (
      <div className="page-container py-20 text-center">
        <div className="glass rounded-2xl p-10 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-6">
            Company accounts cannot add companies. Your company was created during registration.
          </p>
          <Link to="/company/dashboard" className="btn-primary">Go to Company Dashboard</Link>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    description: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('Company name must be at least 2 characters');
      return;
    }

    if (!formData.industry) {
      toast.error('Please select an industry');
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Location is required');
      return;
    }

    try {
      setLoading(true);
      const company = await addCompany(
        {
          name: formData.name.trim(),
          industry: formData.industry,
          location: formData.location.trim(),
          description: formData.description.trim(),
          website: formData.website.trim(),
        },
        user.uid
      );
      toast.success('Company added successfully! 🏢');
      navigate(`/company/${company.id}`);
    } catch {
      toast.error('Failed to add company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Add a Company</h1>
          <p className="text-slate-400 text-sm">Help others by adding a company to ReviewHub</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-slate-300 mb-2">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="company-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Google, Apple, Microsoft"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-300 mb-2">
                Industry <span className="text-red-400">*</span>
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select an industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-2">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. San Francisco, CA"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description <span className="text-slate-600 text-xs font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder="Brief description of the company..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-slate-600 mt-1 text-right">
                {formData.description.length}/500
              </p>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-300 mb-2">
                Website <span className="text-slate-600 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 text-base"
              id="add-company-button"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding company...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Company
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompany;
