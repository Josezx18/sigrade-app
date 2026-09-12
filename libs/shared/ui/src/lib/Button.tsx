import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger' | 'link' | 'success' | 'info' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  isLoading?: boolean;
  asChild?: boolean;
}

const variantMap: Record<string, string> = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  danger: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline',
  success: 'bg-success-600 text-white shadow-sm hover:bg-success-700',
  info: 'bg-primary-100 text-primary-800 shadow-sm hover:bg-primary-200',
  warning: 'bg-warning-100 text-warning-800 shadow-sm hover:bg-warning-200',
};

const sizeMap: Record<string, string> = {
  sm: 'h-8 rounded-md px-3 text-xs',
  md: 'h-9 px-4 py-2',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
  'icon-sm': 'h-8 w-8',
  'icon-lg': 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variantMap[variant], sizeMap[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button };
