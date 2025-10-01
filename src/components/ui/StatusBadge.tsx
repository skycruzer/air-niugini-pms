/**
 * Status Badge Component
 * Aviation certification status badges with Air Niugini branding
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MinusCircle,
  type LucideIcon,
} from 'lucide-react';

export type CertificationStatus = 'current' | 'expiring' | 'expired' | 'pending' | 'inactive';
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: CertificationStatus;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  CertificationStatus,
  {
    label: string;
    variant: StatusVariant;
    icon: LucideIcon;
    className: string;
  }
> = {
  current: {
    label: 'Current',
    variant: 'success',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  },
  expiring: {
    label: 'Expiring Soon',
    variant: 'warning',
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  },
  expired: {
    label: 'Expired',
    variant: 'error',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  },
  pending: {
    label: 'Pending',
    variant: 'info',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  },
  inactive: {
    label: 'Inactive',
    variant: 'default',
    icon: MinusCircle,
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border transition-colors',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} className="flex-shrink-0" />}
      <span>{displayLabel}</span>
    </Badge>
  );
}

/**
 * Get certification status based on days until expiry
 */
export function getCertificationStatus(daysUntilExpiry: number | null): CertificationStatus {
  if (daysUntilExpiry === null) return 'inactive';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'current';
}

/**
 * StatusIndicator
 * Simple dot indicator for compact status display
 */
interface StatusIndicatorProps {
  status: CertificationStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const indicatorSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function StatusIndicator({ status, size = 'md', className }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        indicatorSizes[size],
        config.className.split(' ')[0], // Extract bg-color class
        className
      )}
      title={config.label}
    />
  );
}

/**
 * StatusDot with Label
 * Dot indicator with text label
 */
interface StatusDotWithLabelProps extends StatusIndicatorProps {
  label?: string;
}

export function StatusDotWithLabel({
  status,
  label,
  size = 'md',
  className,
}: StatusDotWithLabelProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <StatusIndicator status={status} size={size} />
      <span className="text-sm font-medium text-gray-700">{displayLabel}</span>
    </div>
  );
}
