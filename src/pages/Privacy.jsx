import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="mb-8 slide-up">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500">Last updated: April 2026</p>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 space-y-6 fade-in">
        <section>
          <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            When you create an account, we collect your email address, display name, and account creation date. When you submit reviews, we store your review content, ratings, and optional proof of employment. We also collect anonymized usage analytics to improve the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Data</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your data is used solely to provide and improve ReviewHub services. Reviews are displayed publicly (with your chosen display name or anonymously). Email addresses are used for account management and important service notifications. We never sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Data Storage & Security</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            All data is stored securely using Google Firebase infrastructure, which provides enterprise-grade encryption at rest and in transit. Uploaded proof images are stored in Firebase Storage with access controls. We implement industry-standard security measures to protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">4. Anonymous Reviews</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            When you choose to post anonymously, your display name is hidden from public view. However, we retain the association internally for moderation purposes. Anonymous reviews cannot be traced back to you by other users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">5. Your Rights</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You can edit or delete your reviews at any time from your Dashboard. You can request complete account deletion by contacting us. Upon deletion, all your personal data and reviews will be permanently removed from our systems.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Cookies & Tracking</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            We use essential cookies for authentication and session management. We do not use third-party tracking cookies or advertising trackers. Firebase Analytics may collect anonymized usage data to help us understand how the platform is used.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
