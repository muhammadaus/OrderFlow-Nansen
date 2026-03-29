import React from 'react';

/**
 * StatCard - Display a key metric with label and optional trend
 * @param {string} label - Metric label
 * @param {string|number} value - Metric value
 * @param {string} trend - 'up' | 'down' | 'neutral'
 * @param {string} trendValue - Trend percentage/value
 * @param {string} variant - 'default' | 'bull' | 'bear'
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export function StatCard({
  label,
  value,
  trend,
  trendValue,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'rounded-lg transition-colors duration-150';

  const variants = {
    default: 'bg-bg-card border border-border-default',
    bull: 'bg-bg-card border border-bull/30',
    bear: 'bg-bg-card border border-bear/30',
  };

  const sizes = {
    sm: { container: 'px-3 py-2', label: 'text-xxs', value: 'text-sm' },
    md: { container: 'px-4 py-3', label: 'text-xxs', value: 'text-lg' },
    lg: { container: 'px-5 py-4', label: 'text-xs', value: 'text-xl' },
  };

  const trendColors = {
    up: 'text-bull',
    down: 'text-bear',
    neutral: 'text-text-muted',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${sizes[size].container} ${className}`}
      {...props}
    >
      <p className={`${sizes[size].label} text-text-muted uppercase tracking-wide font-medium`}>
        {label}
      </p>
      <div className="flex items-baseline justify-between mt-1">
        <p className={`${sizes[size].value} font-semibold text-text-primary font-mono tabular-nums`}>
          {value}
        </p>
        {trend && trendValue && (
          <span className={`${sizes[size].label} ${trendColors[trend]} font-mono tabular-nums`}>
            {trendIcons[trend]} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * StatGrid - Grid layout for multiple StatCards
 */
export function StatGrid({ children, cols = 4, className = '' }) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${colClasses[cols] || 'grid-cols-4'} gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default StatCard;
