/**
 * SlideIn Animation Component
 * Smooth slide-in animation from specified direction
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  className?: string;
}

export function SlideIn({
  children,
  duration = 0.4,
  delay = 0,
  direction = 'right',
  distance = 30,
  className = '',
  ...props
}: SlideInProps) {
  const directionConfig = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const initial = directionConfig[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...initial,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      exit={{
        opacity: 0,
        ...initial,
      }}
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

/**
 * SlideInWhenVisible
 * Slide in when element enters viewport
 */
export function SlideInWhenVisible({
  children,
  duration = 0.4,
  delay = 0,
  direction = 'up',
  distance = 30,
  className = '',
  once = true,
  ...props
}: SlideInProps & { once?: boolean }) {
  const directionConfig = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const initial = directionConfig[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...initial,
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

/**
 * SlideInFromEdge
 * Slide in from screen edge with custom distance
 */
export function SlideInFromEdge({
  children,
  duration = 0.5,
  delay = 0,
  direction = 'right',
  className = '',
  ...props
}: Omit<SlideInProps, 'distance'>) {
  return (
    <SlideIn
      duration={duration}
      delay={delay}
      direction={direction}
      distance={50}
      className={className}
      {...props}
    >
      {children}
    </SlideIn>
  );
}
