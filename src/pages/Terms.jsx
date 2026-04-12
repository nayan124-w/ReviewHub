import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="mb-8 slide-up">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500">Last updated: April 2026</p>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 space-y-6 fade-in">
        <section>
          <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            By accessing or using ReviewHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. These terms apply to all users, contributors, and visitors.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">2. User Accounts</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You may not share your account with others or create multiple accounts for abuse purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Content Guidelines</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Reviews must be based on genuine experiences. You may not post defamatory, misleading, or fraudulent content. ReviewHub reserves the right to remove content that violates these guidelines without prior notice. Each user may submit only one review per company.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">4. Intellectual Property</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Content you submit remains yours, but you grant ReviewHub a non-exclusive, royalty-free license to display, distribute, and promote your reviews on the platform. The ReviewHub brand, design, and codebase are proprietary.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">5. Limitation of Liability</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            ReviewHub is provided &quot;as is&quot; without warranties of any kind. We are not responsible for the accuracy of user-submitted reviews. Use the information on this platform at your own discretion and risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Changes to Terms</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance. We will notify registered users of significant changes via email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
