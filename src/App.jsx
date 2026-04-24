import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

/* ──────────────────────────────────────────────
   React.lazy — code-split all page components
   ────────────────────────────────────────────── */
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));
const AddCompany = lazy(() => import('./pages/AddCompany'));
const AddReview = lazy(() => import('./pages/AddReview'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BrowseReviews = lazy(() => import('./pages/BrowseReviews'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Chat = lazy(() => import('./pages/Chat'));
const Messages = lazy(() => import('./pages/Messages'));
const Jobs = lazy(() => import('./pages/Jobs'));
const CompanyLogin = lazy(() => import('./pages/CompanyLogin'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const PostJob = lazy(() => import('./pages/PostJob'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const OtpLogin = lazy(() => import('./pages/OtpLogin'));
const OtpVerify = lazy(() => import('./pages/OtpVerify'));
const SignupOtpVerify = lazy(() => import('./pages/SignupOtpVerify'));

/* ──────────────────────────────────────────────
   Global loading fallback for Suspense
   ────────────────────────────────────────────── */
const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner text="Loading page..." />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col relative">
            {/* Floating Particles */}
            <div className="particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${15 + Math.random() * 25}s`,
                    animationDelay: `${Math.random() * 15}s`,
                    width: `${2 + Math.random() * 4}px`,
                    height: `${2 + Math.random() * 4}px`,
                    opacity: 0.1 + Math.random() * 0.3,
                  }}
                />
              ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* ── Public Routes ── */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/company/:id" element={<CompanyDetail />} />
                    <Route path="/reviews" element={<BrowseReviews />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/otp-login" element={<OtpLogin />} />
                    <Route path="/otp-verify" element={<OtpVerify />} />
                    <Route path="/signup-otp-verify" element={<SignupOtpVerify />} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* ── Company Routes ── */}
                    <Route path="/company/login" element={<CompanyLogin />} />
                    <Route path="/company/dashboard" element={<CompanyDashboard />} />
                    <Route
                      path="/company/post-job"
                      element={
                        <ProtectedRoute>
                          <PostJob />
                        </ProtectedRoute>
                      }
                    />

                    {/* ── User Protected Routes ── */}
                    <Route
                      path="/add-company"
                      element={
                        <ProtectedRoute>
                          <AddCompany />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-review/:companyId"
                      element={
                        <ProtectedRoute>
                          <AddReview />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat/:userId"
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      }
                    />

                    {/* ── Catch-all 404 ── */}
                    <Route
                      path="*"
                      element={
                        <div className="page-container py-20 text-center fade-in">
                          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
                            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-slate-300 mb-2">Page Not Found</h2>
                          <p className="text-slate-500 mb-6 text-sm">The page you're looking for doesn't exist.</p>
                          <a href="/" className="btn-primary">Go Home</a>
                        </div>
                      }
                    />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(12px)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#e2e8f0',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#e2e8f0',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
