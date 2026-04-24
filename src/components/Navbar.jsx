import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, clearOtpSession } from '../context/AuthContext';
import { logoutUser } from '../services/auth';
import { logoutCompany } from '../services/companyAuth';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, isAuthenticated, isCompany, isOtpSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      // Always clear OTP session if present
      clearOtpSession();

      if (isOtpSession) {
        // OTP session — just clear and reload
        toast.success('Logged out successfully');
        window.location.href = '/';
        return;
      }

      if (isCompany) {
        await logoutCompany();
      } else {
        await logoutUser();
      }
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'text-white bg-white/10'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  /* Underline indicator for active link */
  const activeIndicator = (path) =>
    isActive(path) ? (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-primary-400 to-accent-500" />
    ) : null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5" ref={menuRef}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-200 group-hover:scale-105">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-300 to-accent-400 bg-clip-text text-transparent">
              ReviewHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1.5 ml-8">
            <Link to="/" className={navLinkClass('/')}>
              Home
              {activeIndicator('/')}
            </Link>
            <Link to="/reviews" className={navLinkClass('/reviews')}>
              Reviews
              {activeIndicator('/reviews')}
            </Link>
            <Link to="/jobs" className={navLinkClass('/jobs')}>
              Jobs
              {activeIndicator('/jobs')}
            </Link>
            {isAuthenticated && !isCompany && (
              <>
                <Link to="/add-company" className={navLinkClass('/add-company')}>
                  Add Company
                  {activeIndicator('/add-company')}
                </Link>
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  Dashboard
                  {activeIndicator('/dashboard')}
                </Link>
                <Link to="/messages" className={navLinkClass('/messages')}>
                  Messages
                  {activeIndicator('/messages')}
                </Link>
              </>
            )}
            {isCompany && (
              <Link to="/company/dashboard" className={navLinkClass('/company/dashboard')}>
                <span className="flex items-center gap-1.5">
                  🏢 Company
                </span>
                {activeIndicator('/company/dashboard')}
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {isAuthenticated ? (
              <>
                {!isCompany && (
                  <Link
                    to="/messages"
                    className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-white/5 transition-all duration-200 relative"
                    title="Messages"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </Link>
                )}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full glass-light">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                    isCompany
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-primary-400 to-accent-500'
                  }`}>
                    {user?.displayName?.charAt(0)?.toUpperCase() || (isCompany ? 'C' : 'U')}
                  </div>
                  <span className="text-sm text-slate-300 font-medium max-w-[120px] truncate">
                    {user?.displayName || 'User'}
                  </span>
                  {isCompany && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Co</span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary text-sm !py-2 !px-5">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-white/5 pt-3 space-y-1">
            <Link
              to="/"
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/reviews"
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/reviews') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Browse Reviews
            </Link>
            <Link
              to="/jobs"
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/jobs') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              💼 Jobs
            </Link>
            {isAuthenticated && !isCompany ? (
              <>
                <Link
                  to="/add-company"
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/add-company') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Add Company
                </Link>
                <Link
                  to="/dashboard"
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/dashboard') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/messages') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  💬 Messages
                </Link>
                <div className="border-t border-white/5 mt-2 pt-3 mx-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                      {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{user?.displayName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : isCompany ? (
              <>
                <Link
                  to="/company/dashboard"
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/company/dashboard') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🏢 Company Dashboard
                </Link>
                <Link
                  to="/company/post-job"
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/company/post-job') ? 'text-white bg-white/8' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Post a Job
                </Link>
                <div className="border-t border-white/5 mt-2 pt-3 mx-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                      {user?.displayName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <span className="text-sm text-slate-300 font-medium">{user?.displayName}</span>
                      <span className="ml-2 text-[9px] text-emerald-400 font-bold uppercase">Company</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2.5 px-4 pt-3 border-t border-white/5 mt-2">
                <Link to="/login" className="btn-secondary flex-1 text-sm !py-2.5 text-center">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary flex-1 text-sm !py-2.5 text-center">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
