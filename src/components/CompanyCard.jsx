import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const CompanyCard = ({ company }) => {
  const industryIcons = {
    Technology: '💻',
    Finance: '💰',
    Healthcare: '🏥',
    Education: '📚',
    Retail: '🛍️',
    Manufacturing: '🏭',
    Marketing: '📢',
    Consulting: '🤝',
    'Real Estate': '🏢',
    Other: '🏛️',
  };

  const icon = industryIcons[company.industry] || '🏛️';

  return (
    <Link to={`/company/${company.id}`} className="block">
      <div className="glass rounded-2xl p-6 card-hover group">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:border-primary-500/40 transition-colors">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate group-hover:text-primary-300 transition-colors">
              {company.name}
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">{company.industry}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{company.location}</span>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(company.averageRating || 0)} size="sm" />
            <span className="text-sm font-semibold text-amber-400">
              {company.averageRating ? company.averageRating.toFixed(1) : '—'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {company.totalReviews || 0} {company.totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CompanyCard;
