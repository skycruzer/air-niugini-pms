/**
 * ScaleOnHover Animation Component
 * Smooth scale effect on hover with Air Niugini branding
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface ScaleOnHoverProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export function ScaleOnHover({
  children,
  scale = 1.05,
  duration = 0.2,
  className = '',
  ...props
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        transition: {
          duration,
          ease: [0.4, 0, 0.2, 1] as any,
        },
      }}
      whileTap={{
        scale: scale * 0.95,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleOnHoverCard
 * Card-specific scale effect with shadow enhancement
 */
export function ScaleOnHoverCard({
  children,
  className = '',
  ...props
}: Omit<ScaleOnHoverProps, 'scale'>) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        transition: {
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1] as any,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleOnHoverButton
 * Button-specific scale effect
 */
export function ScaleOnHoverButton({
  children,
  className = '',
  onClick,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{
        scale: 1.05,
        transition: {
          duration: 0.15,
          ease: [0.4, 0, 0.2, 1] as any,
        },
      }}
      whileTap={{
        scale: 0.95,
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/**
 * PressEffect
 * Click/tap press effect for interactive elements
 */
export function PressEffect({
  children,
  scale = 0.95,
  duration = 0.1,
  className = '',
  ...props
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileTap={{
        scale,
        transition: {
          duration,
          ease: [0.4, 0, 0.2, 1] as any,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * PulseOnHover
 * Pulse animation on hover for attention-grabbing elements
 */
export function PulseOnHover({
  children,
  className = '',
  ...props
}: Omit<ScaleOnHoverProps, 'scale' | 'duration'>) {
  return (
    <motion.div
      whileHover={{
        scale: [1, 1.05, 1],
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1] as any,
          repeat: Infinity,
          repeatDelay: 0.2,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * LiftOnHover
 * Lift effect (scale + translateY) for cards and interactive elements
 */
export function LiftOnHover({
  children,
  className = '',
  ...props
}: Omit<ScaleOnHoverProps, 'scale' | 'duration'>) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -6,
        transition: {
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1] as any,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
