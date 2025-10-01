/**
 * Empty State Component
 * Displays empty state with illustration and call-to-action
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, FileX, Search, AlertCircle, Inbox } from 'lucide-react';
import { FadeIn } from '@/components/ui/animated';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'outline';
  };
  variant?: 'default' | 'search' | 'error' | 'empty';
  className?: string;
}

const variantConfig = {
  default: {
    icon: Inbox,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-100',
  },
  search: {
    icon: Search,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-100',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-100',
  },
  empty: {
    icon: FileX,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-100',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  return (
    <FadeIn direction="up" duration={0.4}>
      <Card
        className={cn(
          'flex flex-col items-center justify-center p-12 text-center',
          'border-dashed border-2',
          className
        )}
      >
        {/* Icon */}
        <div className={cn('p-4 rounded-2xl mb-6', config.iconBg)}>
          <Icon className={cn('h-12 w-12', config.iconColor)} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 max-w-md">{description}</p>}
        </div>

        {/* Action Button */}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant === 'primary' ? 'default' : action.variant}
            className={cn(
              action.variant === 'primary' && 'bg-[#E4002B] hover:bg-[#C00020] text-white'
            )}
          >
            {action.label}
          </Button>
        )}
      </Card>
    </FadeIn>
  );
}

/**
 * EmptySearchResult
 * Specialized empty state for search results
 */
interface EmptySearchResultProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

export function EmptySearchResult({
  searchQuery,
  onClearSearch,
  className,
}: EmptySearchResultProps) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={
        searchQuery
          ? `No results found for "${searchQuery}". Try adjusting your search.`
          : 'Try adjusting your filters or search query.'
      }
      action={
        onClearSearch
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
              variant: 'outline',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * EmptyList
 * Specialized empty state for empty lists
 */
interface EmptyListProps {
  resourceName: string;
  onCreateNew?: () => void;
  createLabel?: string;
  description?: string;
  className?: string;
}

export function EmptyList({
  resourceName,
  onCreateNew,
  createLabel,
  description,
  className,
}: EmptyListProps) {
  return (
    <EmptyState
      variant="empty"
      title={`No ${resourceName.toLowerCase()} yet`}
      description={
        description || `Get started by creating your first ${resourceName.toLowerCase()}.`
      }
      action={
        onCreateNew
          ? {
              label: createLabel || `Create ${resourceName}`,
              onClick: onCreateNew,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * ErrorState
 * Specialized empty state for errors
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading the data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
              variant: 'default',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * NoDataCard
 * Compact empty state for cards/sections
 */
interface NoDataCardProps {
  message?: string;
  icon?: LucideIcon;
  className?: string;
}

export function NoDataCard({
  message = 'No data available',
  icon: Icon = Inbox,
  className,
}: NoDataCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        'bg-gray-50 rounded-xl border border-gray-200 border-dashed',
        className
      )}
    >
      <Icon className="h-10 w-10 text-gray-400 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
