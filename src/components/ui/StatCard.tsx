/**
 * Stat Card Component
 * Modern dashboard statistics card with Air Niugini branding
 */

'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FadeIn } from '@/components/ui/animated';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  animated?: boolean;
}

const variantStyles = {
  default: {
    bg: 'bg-white',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    border: 'border-gray-200',
  },
  primary: {
    bg: 'bg-white',
    iconBg: 'bg-[#E4002B]/10',
    iconColor: 'text-[#E4002B]',
    border: 'border-[#E4002B]/20',
  },
  secondary: {
    bg: 'bg-white',
    iconBg: 'bg-[#FFC72C]/10',
    iconColor: 'text-[#FFC72C]',
    border: 'border-[#FFC72C]/20',
  },
  success: {
    bg: 'bg-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
  },
  warning: {
    bg: 'bg-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
  },
};

const getTrendIcon = (direction?: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
};

const getTrendColor = (direction?: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  animated = true,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const TrendIcon = trend ? getTrendIcon(trend.direction) : null;
  const trendColor = trend ? getTrendColor(trend.direction) : '';

  const CardContent = (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        styles.bg,
        styles.border,
        'border',
        className
      )}
    >
      <div className="p-6 space-y-4">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>

          {Icon && (
            <div
              className={cn(
                'p-3 rounded-xl transition-transform duration-300 hover:scale-110',
                styles.iconBg
              )}
            >
              <Icon className={cn('h-6 w-6', styles.iconColor)} />
            </div>
          )}
        </div>

        {/* Trend Section */}
        {trend && (
          <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
            {TrendIcon && <TrendIcon className={cn('h-4 w-4', trendColor)} />}
            <span className={cn('text-sm font-medium', trendColor)}>
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-sm text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>

      {/* Decorative gradient overlay */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 opacity-5 blur-3xl rounded-full',
          styles.iconBg
        )}
      />
    </Card>
  );

  if (animated) {
    return (
      <FadeIn direction="up" duration={0.4}>
        {CardContent}
      </FadeIn>
    );
  }

  return CardContent;
}

/**
 * StatCardGrid
 * Grid layout for multiple stat cards
 */
interface StatCardGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({ stats, columns = 4, className }: StatCardGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridClasses[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

/**
 * CompactStatCard
 * Smaller version for inline stats
 */
export function CompactStatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  className,
}: Omit<StatCardProps, 'subtitle' | 'trend' | 'animated'>) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-md',
        styles.bg,
        styles.border,
        className
      )}
    >
      {Icon && (
        <div className={cn('p-2 rounded-lg', styles.iconBg)}>
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-gray-600">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
