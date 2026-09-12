import * as React from 'react';
import { cn } from './cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'info';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const badgeVariant = variant === 'primary' ? 'default' : variant;
    const variants: Record<string, string> = {
      default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      success: 'border-transparent bg-success-100 text-success-800 hover:bg-success-200',
      warning: 'border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200',
      danger: 'border-transparent bg-danger-100 text-danger-800 hover:bg-danger-200',
      info: 'border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200',
      outline: 'text-foreground border-border',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[badgeVariant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
