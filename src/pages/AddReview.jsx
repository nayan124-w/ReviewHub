console.log("AddReview loaded");
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCompanyById } from '../services/companies';
import { addReview } from '../services/reviews';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { updateCompanyRating } from '../services/companies';

const AddReview = () => {
  const { companyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    description: '',
    isAnonymous: false,
  });

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const data = await getCompanyById(companyId);
      if (!data) {
        toast.error('Company not found');
        navigate('/');
        return;
      }
      setCompany(data);
    } catch {
      toast.error('Failed to load company');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return; // Prevent duplicate submissions

    if (formData.rating === 0) {
      toast.error('Rating required — please select a star');
      return;
    }

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      await addReview({
        companyId,
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email,
        rating: formData.rating,
        title: formData.title.trim(),
        description: formData.description.trim(),
        isAnonymous: formData.isAnonymous,
      });

      await updateCompanyRating(companyId);

      // addReview already calls updateCompanyRating internally

      toast.success('Review submitted successfully! 🙏');
      navigate(`/company/${companyId}`);
    } catch (error) {
      if (error.message === 'You have already reviewed this company.') {
        toast.error('You have already reviewed this company');
      } else {
        toast.error('Error submitting review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading..." />;
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

  const ratingLabels = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg slide-up">
        {/* Back Link */}
        <Link
          to={`/company/${companyId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {company.name}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Write a Review</h1>
          <p className="text-slate-400">
            Share your experience at{' '}
            <span className="text-primary-400 font-medium">{company.name}</span>
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Overall Rating <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-4">
                <StarRating
                  rating={formData.rating}
                  onRate={(value) => setFormData({ ...formData, rating: value })}
                  size="xl"
                />
                {formData.rating > 0 && (
                  <span className="text-lg font-bold text-amber-400">
                    {formData.rating}.0
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {formData.rating === 0 ? 'Click a star to rate' : ratingLabels[formData.rating]}
              </p>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="review-title" className="block text-sm font-medium text-slate-300 mb-2">
                Review Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="review-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Summarize your experience..."
                maxLength={100}
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {formData.title.length}/100
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="review-description" className="block text-sm font-medium text-slate-300 mb-2">
                Your Review <span className="text-red-400">*</span>
              </label>
              <textarea
                id="review-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder="Share details about your experience — what did you like or dislike? Would you recommend this company?"
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {formData.description.length}/2000
              </p>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-950/50 border border-white/5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="sr-only peer"
                  id="anonymous-toggle"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
              <div>
                <p className="text-sm font-medium text-slate-300">Post anonymously</p>
                <p className="text-xs text-slate-500">Your name won't appear with the review</p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="btn-primary w-full !py-3 text-base"
              id="submit-review-button"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddReview;
