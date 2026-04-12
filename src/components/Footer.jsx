import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="page-container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-primary-300 to-accent-400 bg-clip-text text-transparent">
              ReviewHub
            </span>
          </Link>

          {/* Copyright */}
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} ReviewHub. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-5">
            <Link to="/reviews" className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200">
              Browse Reviews
            </Link>
            <Link to="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200">
              Terms
            </Link>
            <Link to="/contact" className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
