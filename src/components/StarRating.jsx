import { useState } from 'react';

const StarRating = ({ rating = 0, onRate = null, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const [pulseStar, setPulseStar] = useState(0);

  const sizes = {
    sm: { cls: 'w-4 h-4', gap: 'gap-0.5' },
    md: { cls: 'w-6 h-6', gap: 'gap-1' },
    lg: { cls: 'w-8 h-8', gap: 'gap-1' },
    xl: { cls: 'w-10 h-10', gap: 'gap-1.5' },
  };

  const { cls, gap } = sizes[size] || sizes.md;
  const interactive = typeof onRate === 'function';

  const handleClick = (star) => {
    if (!interactive) return;
    onRate(star);
    setPulseStar(star);
    setTimeout(() => setPulseStar(0), 300);
  };

  return (
    <div className={`flex items-center ${gap}`} role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-all duration-200 disabled:cursor-default ${pulseStar === star ? 'star-pulse' : ''}`}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              className={`${cls} transition-colors duration-200 ${
                filled ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'text-slate-600'
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
