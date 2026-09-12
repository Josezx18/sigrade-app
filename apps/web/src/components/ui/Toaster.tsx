import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast, toast } from '../../hooks/useToast';

const ToastIcons = {
  default: Info,
  success: CheckCircle,
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ToastColors = {
  default: 'border-secondary-200 bg-white',
  success: 'border-success-200 bg-success-50',
  danger: 'border-danger-200 bg-danger-50',
  warning: 'border-warning-200 bg-warning-50',
  info: 'border-primary-200 bg-primary-50',
};

const ToastIconColors = {
  default: 'text-secondary-500',
  success: 'text-success-500',
  danger: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
};

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

function Toast({ id, title, description, variant = 'default', duration = 5000, onClose }: ToastProps) {
  const Icon = ToastIcons[variant];
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'toast animate-in slide-in-from-top-2',
        ToastColors[variant]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', ToastIconColors[variant])} />
        <div className="flex-1 min-w-0">
          {title && <p className="font-medium text-secondary-900">{title}</p>}
          {description && <p className="text-sm text-secondary-600 mt-0.5">{description}</p>}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 200);
          }}
          className="flex-shrink-0 p-1 text-secondary-400 hover:text-secondary-600 rounded hover:bg-secondary-100"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="toast-container fixed bottom-4 right-4 z-80 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          duration={toast.duration}
          onClose={useToast.getState().removeToast}
        />
      ))}
    </div>
  );
}

export { toast };
export type { ToastProps };