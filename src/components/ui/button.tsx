import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary (Indigo)
        default:
          'bg-[#4F46E5] text-white shadow-sm hover:bg-[#4338CA] focus-visible:ring-[#4F46E5]',

        // Secondary (Cyan)
        secondary:
          'bg-[#06B6D4] text-white shadow-sm hover:bg-[#0891B2] focus-visible:ring-[#06B6D4]',

        // Destructive (Rose)
        destructive: 'bg-rose-500 text-white shadow-sm hover:bg-rose-600 focus-visible:ring-rose-500',

        // Outline (Indigo)
        outline:
          'border-2 border-[#4F46E5] bg-background text-[#4F46E5] shadow-sm hover:bg-[#4F46E5] hover:text-white focus-visible:ring-[#4F46E5]',

        // Ghost (neutral)
        ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400',

        // Link
        link: 'text-[#4F46E5] underline-offset-4 hover:underline focus-visible:ring-[#4F46E5]',

        // Accent (gradient)
        accent:
          'bg-gradient-to-r from-[#4338CA] to-[#4F46E5] text-white shadow-md hover:shadow-lg focus-visible:ring-[#4F46E5]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
