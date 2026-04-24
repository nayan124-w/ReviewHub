import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOtp, requestOtp, OTP_CONFIG } from '../services/otp';
import { sendOtpEmail } from '../services/emailService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

const OtpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(OTP_CONFIG.cooldownSeconds);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email from previous screen
  useEffect(() => {
    if (!email) {
      navigate('/otp-login', { replace: true });
    }
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  /* ── OTP Input Handlers ── */
  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace — move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Arrow keys navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextEmpty = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  /* ── Verify OTP ── */
  const handleVerify = async (e) => {
    e?.preventDefault();

    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);

      const result = await verifyOtp(email, otpString);

      if (!result.success) {
        toast.error(result.message);

        // If too many attempts or expired, redirect back
        if (result.error === 'too-many-attempts' || result.error === 'expired' || result.error === 'no-otp') {
          setTimeout(() => navigate('/otp-login', { replace: true }), 1500);
        }

        // Clear OTP inputs on wrong code
        if (result.error === 'wrong-otp') {
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
        return;
      }

      // OTP verified — find user in Firestore and sign them in
      // Since this is OTP login, we look up the user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', result.email)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        // No user account found — inform user they need to register first
        toast.error('No account found with this email. Please sign up first.');
        setTimeout(() => navigate('/register', { replace: true }), 1500);
        return;
      }

      // User exists — create a custom session
      // Since we can't sign in without password via client SDK,
      // we store a session marker and use the auth state
      // For production, you'd use Firebase Admin SDK with custom tokens.
      // Here we use a workaround: store session in localStorage and validate
      const userData = usersSnapshot.docs[0].data();

      // Store OTP session
      const sessionData = {
        uid: usersSnapshot.docs[0].id,
        email: result.email,
        displayName: userData.displayName || 'User',
        otpVerified: true,
        timestamp: Date.now(),
      };
      localStorage.setItem('reviewhub_otp_session', JSON.stringify(sessionData));

      toast.success(`Welcome back, ${userData.displayName || 'User'}! 🎉`);
      
      // Force auth context refresh by reloading
      // This ensures the AuthProvider picks up the session
      window.location.href = '/';
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;

    try {
      setResending(true);

      const result = await requestOtp(email);

      if (!result.success) {
        toast.error(result.message);
        if (result.waitSeconds) {
          setResendTimer(result.waitSeconds);
        }
        return;
      }

      const emailResult = await sendOtpEmail(email, result.otp);

      if (!emailResult.success) {
        toast.error(emailResult.error || 'Failed to resend OTP');
        return;
      }

      toast.success('New OTP sent to your email!');
      setResendTimer(OTP_CONFIG.cooldownSeconds);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
          <p className="text-slate-400">
            Enter the 6-digit code sent to{' '}
            <span className="text-primary-400 font-medium">{email}</span>
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Inputs */}
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  id={`otp-digit-${index}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Expiry info */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Code expires in {OTP_CONFIG.expiryMinutes} minutes
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn-primary w-full !py-3 text-base"
              id="verify-otp-btn"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify & Sign In
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
            {resendTimer > 0 ? (
              <p className="text-sm text-slate-400">
                Resend available in{' '}
                <span className="text-primary-400 font-semibold tabular-nums">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors disabled:opacity-50"
                id="resend-otp-btn"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <Link
            to="/login"
            className="btn-secondary w-full !py-3 text-base text-center block"
          >
            Sign in with Password
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
