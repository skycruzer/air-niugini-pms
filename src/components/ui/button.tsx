import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Air Niugini Primary (Red)
        default:
          'bg-[#E4002B] text-white shadow-sm hover:bg-[#C00020] focus-visible:ring-[#E4002B]',

        // Air Niugini Secondary (Gold)
        secondary:
          'bg-[#FFC72C] text-black shadow-sm hover:bg-[#E6B027] focus-visible:ring-[#FFC72C]',

        // Destructive (compatible with brand red)
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600',

        // Outline (Air Niugini Red)
        outline:
          'border-2 border-[#E4002B] bg-background text-[#E4002B] shadow-sm hover:bg-[#E4002B] hover:text-white focus-visible:ring-[#E4002B]',

        // Ghost (neutral)
        ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400',

        // Link
        link: 'text-[#E4002B] underline-offset-4 hover:underline focus-visible:ring-[#E4002B]',

        // Aviation (gradient)
        aviation:
          'bg-gradient-to-r from-[#C00020] to-[#E4002B] text-white shadow-md hover:shadow-lg focus-visible:ring-[#E4002B]',
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
