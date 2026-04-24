import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/auth';
import { getCompanyUser, getCompanyProfile } from '../services/companyAuth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Check for a valid OTP session in localStorage.
 * OTP sessions expire after 24 hours.
 */
const getOtpSession = () => {
  try {
    const raw = localStorage.getItem('reviewhub_otp_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Expire OTP sessions after 24 hours
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('reviewhub_otp_session');
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem('reviewhub_otp_session');
    return null;
  }
};

/** Clear OTP session */
export const clearOtpSession = () => {
  localStorage.removeItem('reviewhub_otp_session');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [accountType, setAccountType] = useState(null); // 'user' | 'company' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ── Existing Firebase Auth flow (untouched) ──
        setUser(firebaseUser);
        try {
          // Check if this is a company account first
          const companyUser = await getCompanyUser(firebaseUser.uid);
          if (companyUser && companyUser.role === 'company') {
            setAccountType('company');
            const profile = await getCompanyProfile(firebaseUser.uid);
            setCompanyProfile(profile);
            setUserProfile(null);
          } else {
            // Regular user
            setAccountType('user');
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
            setCompanyProfile(null);
          }
        } catch {
          /* profile fetch failed — continue without it */
          setAccountType('user');
        }
      } else {
        // ── No Firebase user — check for OTP session ──
        const otpSession = getOtpSession();
        if (otpSession && otpSession.otpVerified) {
          // Create a minimal user-like object for OTP sessions
          setUser({
            uid: otpSession.uid,
            email: otpSession.email,
            displayName: otpSession.displayName,
            isOtpSession: true,
          });
          setAccountType('user');
          // Fetch full profile from Firestore
          try {
            const profile = await getUserProfile(otpSession.uid);
            setUserProfile(profile);
          } catch {
            setUserProfile({
              email: otpSession.email,
              displayName: otpSession.displayName,
              userId: otpSession.uid,
            });
          }
          setCompanyProfile(null);
        } else {
          setUser(null);
          setUserProfile(null);
          setCompanyProfile(null);
          setAccountType(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    companyProfile,
    accountType,
    loading,
    isAuthenticated: !!user,
    isCompany: accountType === 'company',
    isUser: accountType === 'user',
    isOtpSession: !!user?.isOtpSession,
    clearOtpSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

