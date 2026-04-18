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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [accountType, setAccountType] = useState(null); // 'user' | 'company' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
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
        setUserProfile(null);
        setCompanyProfile(null);
        setAccountType(null);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
