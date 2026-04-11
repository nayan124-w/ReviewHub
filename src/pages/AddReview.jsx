import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addReview, hasUserReviewedCompany } from '../services/reviews';
import { getCompanyById } from '../services/companies';
import { uploadProofImage } from '../services/proof';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';

const AddReview = () => {
  const { companyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [proofType, setProofType] = useState('none'); // 'none' | 'image' | 'text'
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [companyData, hasReviewed] = await Promise.all([
          getCompanyById(companyId),
          user ? hasUserReviewedCompany(user.uid, companyId) : false,
        ]);
        setCompany(companyData);
        setAlreadyReviewed(hasReviewed);
      } catch {
        toast.error('Failed to load company');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [companyId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!description.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setSubmitting(true);

      // Handle proof upload
      let proofData = { proofType: null, proofUrl: null };
      if (proofType === 'image' && proofFile) {
        proofData = await uploadProofImage(proofFile, user.uid, companyId);
      } else if (proofType === 'text' && proofText.trim()) {
        proofData = { proofType: 'text', proofUrl: proofText.trim() };
      }

      await addReview({
        companyId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating,
        title: title.trim() || `Review of ${company?.name || 'Company'}`,
        description: description.trim(),
        isAnonymous,
        ...proofData,
      });

      toast.success('Review submitted successfully!');
      navigate(`/company/${companyId}`);
    } catch (error) {
      toast.error(error.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading..." />;

  if (!company) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-300 mb-4">Company not found</h2>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="page-container py-20 text-center">
        <div className="glass rounded-2xl p-10 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Already Reviewed</h2>
          <p className="text-slate-400 text-sm mb-6">
            You've already written a review for {company.name}. You can edit it from your dashboard.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
            <Link to={`/company/${companyId}`} className="btn-secondary">View Company</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-12">
      {/* Back link */}
      <Link
        to={`/company/${companyId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to {company.name}
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-6 sm:p-8 slide-up">
          <h1 className="text-2xl font-bold text-white mb-1">Write a Review</h1>
          <p className="text-sm text-slate-400 mb-8">
            Share your experience at <span className="text-primary-400 font-medium">{company.name}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Your Rating <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-8 h-8 ${star <= rating ? 'text-amber-400' : 'text-slate-600'} transition-colors`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm text-slate-400 ml-2">{rating}/5</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience in a few words"
                className="input-field"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Review <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share details about your experience — culture, management, growth, pay…"
                rows={5}
                className="input-field resize-none"
                required
              />
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 rounded-full bg-slate-700 peer-checked:bg-primary-500 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-slate-300">Post anonymously</span>
            </label>

            {/* Proof of Review */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Proof of Employment <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="flex gap-3 mb-3">
                {['none', 'image', 'text'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProofType(type)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      proofType === type
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {type === 'none' ? 'No proof' : type === 'image' ? '📷 Image' : '📝 Text'}
                  </button>
                ))}
              </div>
              {proofType === 'image' && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20 transition-colors"
                />
              )}
              {proofType === 'text' && (
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Describe your proof (e.g., employee ID, role period…)"
                  rows={2}
                  className="input-field resize-none"
                />
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                'Submit Review'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddReview;