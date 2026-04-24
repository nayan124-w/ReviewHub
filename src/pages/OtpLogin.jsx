import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestOtp, OTP_CONFIG } from '../services/otp';
import { sendOtpEmail, isEmailServiceConfigured } from '../services/emailService';
import toast from 'react-hot-toast';

const OtpLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if email service is configured
    if (!isEmailServiceConfigured()) {
      toast.error('Email service is not configured. Please contact the admin.');
      return;
    }

    try {
      setLoading(true);

      // Request OTP (generates, stores in Firestore, checks cooldown)
      const result = await requestOtp(email);

      if (!result.success) {
        if (result.error === 'cooldown') {
          toast.error(result.message);
        } else {
          toast.error(result.message || 'Failed to generate OTP');
        }
        return;
      }

      // Send OTP via email
      const emailResult = await sendOtpEmail(email, result.otp);

      if (!emailResult.success) {
        toast.error(emailResult.error || 'Failed to send OTP email');
        return;
      }

      toast.success('OTP sent to your email!');

      // Navigate to OTP verification screen
      navigate('/otp-verify', {
        state: { email: email.toLowerCase().trim() },
      });
    } catch (error) {
      console.error('OTP request error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Login with OTP</h1>
          <p className="text-slate-400">We'll send a one-time password to your email</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="otp-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="otp-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Info note */}
            <div className="flex gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-400 leading-relaxed">
                A {OTP_CONFIG.length}-digit verification code will be sent to your email.
                The code expires in {OTP_CONFIG.expiryMinutes} minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 text-base"
              id="send-otp-btn"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending OTP...
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send OTP
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="btn-secondary w-full !py-3 text-base text-center block"
            >
              Sign in with Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpLogin;
