import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Primary (Indigo)
        default:
          'border-transparent bg-[#4F46E5] text-white shadow-sm hover:bg-[#4338CA]',

        // Secondary (Cyan)
        secondary:
          'border-transparent bg-[#06B6D4] text-white shadow-sm hover:bg-[#0891B2]',

        // Destructive (Rose)
        destructive:
          'border-transparent bg-rose-500 text-white shadow-sm hover:bg-rose-600',

        // Outline (Indigo - WCAG AA compliant contrast)
        outline: 'text-[#4338CA] border-[#4F46E5]',

        // Modern semantic status badges
        success: 'border-transparent bg-emerald-100 text-emerald-800',
        warning: 'border-transparent bg-amber-100 text-amber-800',
        error: 'border-transparent bg-rose-100 text-rose-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
