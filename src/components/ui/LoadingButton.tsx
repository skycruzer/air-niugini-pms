/**
 * Loading Button Component
 * Button with integrated loading state and spinner
 */

'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      icon: Icon,
      iconPosition = 'left',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const displayText = loading && loadingText ? loadingText : children;

    return (
      <Button ref={ref} disabled={isDisabled} className={cn('relative', className)} {...props}>
        {/* Loading State */}
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

        {/* Icon - Left Position */}
        {!loading && Icon && iconPosition === 'left' && <Icon className="mr-2 h-4 w-4" />}

        {/* Button Text */}
        <span>{displayText}</span>

        {/* Icon - Right Position */}
        {!loading && Icon && iconPosition === 'right' && <Icon className="ml-2 h-4 w-4" />}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

/**
 * LoadingIconButton
 * Icon-only button with loading state
 */
export interface LoadingIconButtonProps extends ButtonProps {
  loading?: boolean;
  icon: LucideIcon;
  loadingIcon?: LucideIcon;
}

export const LoadingIconButton = forwardRef<HTMLButtonElement, LoadingIconButtonProps>(
  (
    { loading = false, icon: Icon, loadingIcon: LoadingIcon, disabled, className, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const DisplayIcon = loading ? LoadingIcon || Loader2 : Icon;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        size="icon"
        className={cn('relative', className)}
        {...props}
      >
        <DisplayIcon className={cn('h-4 w-4', loading && 'animate-spin')} />
      </Button>
    );
  }
);

LoadingIconButton.displayName = 'LoadingIconButton';

/**
 * AsyncButton
 * Button that handles async operations with automatic loading state
 */
export interface AsyncButtonProps
  extends Omit<LoadingButtonProps, 'loading' | 'onClick' | 'onError'> {
  onClick: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function AsyncButton({
  onClick,
  onSuccess,
  onError,
  loadingText = 'Processing...',
  children,
  ...props
}: AsyncButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton loading={loading} loadingText={loadingText} onClick={handleClick} {...props}>
      {children}
    </LoadingButton>
  );
}

// Import React for AsyncButton useState
import React from 'react';
