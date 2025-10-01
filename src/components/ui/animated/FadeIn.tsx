/**
 * FadeIn Animation Component
 * Smooth fade-in animation with configurable duration and delay
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
}

export function FadeIn({
  children,
  duration = 0.5,
  delay = 0,
  direction = 'none',
  distance = 20,
  className = '',
  ...props
}: FadeInProps) {
  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...offset,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1] as any, // Air Niugini smooth easing
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInWhenVisible
 * Fade in when element enters viewport
 */
export function FadeInWhenVisible({
  children,
  duration = 0.5,
  delay = 0,
  direction = 'up',
  distance = 20,
  className = '',
  once = true,
  ...props
}: FadeInProps & { once?: boolean }) {
  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...offset,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once, margin: '-50px' }}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1] as any,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
