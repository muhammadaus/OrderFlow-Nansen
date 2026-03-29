import React from 'react';

/**
 * Card - Professional card component
 * @param {string} variant - 'default' | 'elevated' | 'outlined'
 * @param {string} padding - 'none' | 'sm' | 'md' | 'lg'
 * @param {boolean} hoverable - Enable hover effects
 */
export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = false,
  ...props
}) {
  const baseStyles = 'rounded-lg transition-colors duration-150';

  const variants = {
    default: 'bg-bg-card border border-border-default',
    elevated: 'bg-bg-elevated border border-border-default shadow-md',
    outlined: 'bg-transparent border border-border-default',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverStyles = hoverable
    ? 'hover:border-border-hover hover:bg-bg-elevated cursor-pointer'
    : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader - Consistent card header styling
 */
export function CardHeader({ children, className = '', title, subtitle, action }) {
  if (title || subtitle || action) {
    return (
      <div className={`px-4 py-3 border-b border-border-subtle flex items-center justify-between ${className}`}>
        <div>
          {title && (
            <h3 className="text-sm font-semibold text-text-primary">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 border-b border-border-subtle ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardBody - Consistent card body styling
 */
export function CardBody({ children, className = '', padding = 'md' }) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Consistent card footer styling
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-t border-border-subtle ${className}`}>
      {children}
    </div>
  );
}

export default Card;
