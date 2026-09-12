import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      className,
      ...props
    },
    ref
  ) => {
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-full',
      full: 'max-w-[90vw]',
    };

    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in',
              'data-[state=open]:fade-in data-[state=closed]:fade-out'
            )}
            onClick={handleOverlayClick}
          />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl animate-in',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
              'data-[state=closed]:fade-out data-[state=open]:fade-in',
              sizes[size],
              'sm:max-w-xl',
              className
            )}
            onKeyDown={handleKeyDown}
            {...props}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {title && (
                    <DialogPrimitive.Title className="text-lg font-semibold text-secondary-900">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                  {description && (
                    <DialogPrimitive.Description className="mt-1 text-sm text-secondary-500">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
                {showCloseButton && (
                  <DialogPrimitive.Close
                    className={cn(
                      'rounded-lg p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600',
                      'transition-colors focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                    )}
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </DialogPrimitive.Close>
                )}
              </div>
            )}
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);

Modal.displayName = 'Modal';

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  size?: 'sm' | 'md';
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  isLoading = false,
  size = 'md',
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size={size}
      showCloseButton={true}
    >
      <p className="text-secondary-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'default'}
          onClick={handleConfirm}
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? '' : confirmText}
        </Button>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
              Procesando...
      </div>
    </Modal>
  );
}

export interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onConfirm?: () => void;
  size?: 'sm' | 'md';
}

export function AlertModal({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Entendido',
  variant = 'info',
  onConfirm,
  size = 'md',
}: AlertModalProps) {
  const variantIcons = {
    info: (
      <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg className="h-6 w-6 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const variantBg = {
    info: 'bg-primary-50 border-primary-200',
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    danger: 'bg-danger-50 border-danger-200',
  };

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size={size}
      showCloseButton={true}
    >
      <div className={cn('flex gap-4 p-4 rounded-lg border', variantBg[variant])}>
        <div className="flex-shrink-0 mt-0.5">{variantIcons[variant]}</div>
        <div className="flex-1">
          <p className="text-secondary-700">{message}</p>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <Button onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export { Modal };
