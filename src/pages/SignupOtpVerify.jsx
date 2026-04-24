import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOtp, requestOtp, OTP_CONFIG } from '../services/otp';
import { sendOtpEmail, isEmailServiceConfigured } from '../services/emailService';
import { registerUser } from '../services/auth';
import { registerCompany } from '../services/companyAuth';
import toast from 'react-hot-toast';

/**
 * OTP Verification screen for signup.
 * Expects location.state to contain:
 *  - email: string
 *  - signupType: 'user' | 'company'
 *  - signupData: object (form fields needed for registration)
 *  - otp: string (the generated OTP, only used for fallback display if email fails)
 */
const SignupOtpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, signupType, signupData } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(OTP_CONFIG.cooldownSeconds);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no data from previous screen
  useEffect(() => {
    if (!email || !signupType || !signupData) {
      navigate('/register', { replace: true });
    }
  }, [email, signupType, signupData, navigate]);

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
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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

    const nextEmpty = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  /* ── Verify OTP & Complete Signup ── */
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

        if (result.error === 'too-many-attempts' || result.error === 'expired' || result.error === 'no-otp') {
          setTimeout(() => navigate('/register', { replace: true }), 1500);
        }

        if (result.error === 'wrong-otp') {
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
        return;
      }

      // OTP verified ✅ — proceed with actual registration
      if (signupType === 'company') {
        await registerCompany(signupData.email, signupData.password, {
          name: signupData.name,
          industry: signupData.industry || '',
          location: signupData.location || '',
          website: signupData.website || '',
          about: signupData.about || '',
        });
        toast.success('Company account created! 🎉');
        navigate('/company/dashboard', { replace: true });
      } else {
        await registerUser(
          signupData.email,
          signupData.password,
          signupData.displayName,
          signupData.college || ''
        );
        toast.success('Account created! Welcome to ReviewHub 🎉');
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Signup after OTP error:', error);
      const messages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password is too weak',
      };
      toast.error(messages[error.code] || error.message || 'Failed to create account');
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

      // Send OTP via email
      if (isEmailServiceConfigured()) {
        const emailResult = await sendOtpEmail(email, result.otp);
        if (!emailResult.success) {
          toast.error(emailResult.error || 'Failed to resend OTP');
          return;
        }
        toast.success('New OTP sent to your email!');
      } else {
        // Dev fallback
        toast.success(`Dev OTP: ${result.otp}`);
      }

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
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
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
                  id={`signup-otp-digit-${index}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Expiry info */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Code expires in {OTP_CONFIG.expiryMinutes} minutes · Max {OTP_CONFIG.maxAttempts} attempts
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn-primary w-full !py-3 text-base"
              id="signup-verify-otp-btn"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying & Creating Account...
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify & Create Account
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
                id="signup-resend-otp-btn"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          {/* Back to register */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <Link
            to={signupType === 'company' ? '/company/login' : '/register'}
            className="btn-secondary w-full !py-3 text-base text-center block"
          >
            Back to {signupType === 'company' ? 'Company Signup' : 'Registration'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupOtpVerify;
