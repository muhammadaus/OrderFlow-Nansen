import React, { useState } from 'react';

/**
 * InfoCarousel - Carousel for educational content with navigation
 * @param {Array} items - Array of { title, content, icon? }
 * @param {string} variant - 'default' | 'aurora' | 'glass'
 */
export function InfoCarousel({
  items = [],
  variant = 'default',
  className = '',
  autoPlay = false,
  interval = 5000,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const variants = {
    default: 'bg-navy border border-border-subtle',
    aurora: 'bg-deep-purple/60 aurora-border',
    glass: 'bg-deep-purple/40 backdrop-blur-sm border border-accent/20',
  };

  const goTo = (index) => {
    if (index < 0) {
      setActiveIndex(items.length - 1);
    } else if (index >= items.length) {
      setActiveIndex(0);
    } else {
      setActiveIndex(index);
    }
  };

  React.useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    const timer = setInterval(() => goTo(activeIndex + 1), interval);
    return () => clearInterval(timer);
  }, [activeIndex, autoPlay, interval, items.length]);

  if (!items.length) return null;

  const current = items[activeIndex];

  return (
    <div className={`${variants[variant]} rounded p-4 ${className}`}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {current.icon && (
            <span className="text-accent text-sm">{current.icon}</span>
          )}
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            {current.title}
          </h4>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(activeIndex - 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-navy/50 text-text-muted hover:text-white hover:bg-accent/20 transition-all text-xs"
            aria-label="Previous"
          >
            ‹
          </button>
          <span className="text-xxs text-text-muted tabular-nums">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-navy/50 text-text-muted hover:text-white hover:bg-accent/20 transition-all text-xs"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="min-h-[80px]">
        {typeof current.content === 'string' ? (
          <p className="text-xs text-text-primary leading-relaxed">
            {current.content}
          </p>
        ) : (
          current.content
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3 pt-2 border-t border-border-subtle/30">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === activeIndex
                ? 'bg-accent w-4'
                : 'bg-border-subtle hover:bg-text-muted'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * InfoCard - Single info card for static content
 */
export function InfoCard({
  title,
  icon,
  children,
  variant = 'default',
  borderColor = 'border-corporate-blue',
  className = '',
}) {
  return (
    <div className={`bg-navy/30 px-3 py-2 border-l-2 ${borderColor} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-sm">{icon}</span>}
        <h4 className="text-xxs font-semibold text-text-muted uppercase tracking-wide">
          {title}
        </h4>
      </div>
      <div className="text-xxs text-text-primary leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default InfoCarousel;
