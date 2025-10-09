import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Air Niugini Primary (Red)
        default:
          'border-transparent bg-[#E4002B] text-white shadow-sm hover:bg-[#C00020]',

        // Air Niugini Secondary (Gold)
        secondary:
          'border-transparent bg-[#FFC72C] text-black shadow-sm hover:bg-[#E6B027]',

        // Destructive
        destructive:
          'border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700',

        // Outline (Air Niugini Red - WCAG AA compliant contrast)
        outline: 'text-[#C00020] border-[#E4002B]',

        // Aviation status badges (keep unchanged for compliance)
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-amber-100 text-amber-800',
        error: 'border-transparent bg-red-100 text-red-800',
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
