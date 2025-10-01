/**
 * StaggerChildren Animation Component
 * Animates children with staggered delays
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerChildrenProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  staggerDelay?: number;
  duration?: number;
  initialDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
}

export function StaggerChildren({
  children,
  staggerDelay = 0.1,
  duration = 0.4,
  initialDelay = 0,
  direction = 'up',
  distance = 20,
  className = '',
  ...props
}: StaggerChildrenProps) {
  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      ...offset,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.4, 0, 0.2, 1] as any,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * StaggerList
 * Specialized stagger animation for lists
 */
export function StaggerList({
  children,
  staggerDelay = 0.05,
  duration = 0.3,
  className = '',
  ...props
}: StaggerChildrenProps) {
  return (
    <StaggerChildren
      staggerDelay={staggerDelay}
      duration={duration}
      direction="up"
      distance={10}
      className={className}
      {...props}
    >
      {children}
    </StaggerChildren>
  );
}

/**
 * StaggerGrid
 * Specialized stagger animation for grid layouts
 */
export function StaggerGrid({
  children,
  staggerDelay = 0.08,
  duration = 0.4,
  className = '',
  ...props
}: StaggerChildrenProps) {
  return (
    <StaggerChildren
      staggerDelay={staggerDelay}
      duration={duration}
      direction="up"
      distance={15}
      className={className}
      {...props}
    >
      {children}
    </StaggerChildren>
  );
}

/**
 * StaggerChildrenWhenVisible
 * Stagger animation triggered when entering viewport
 */
export function StaggerChildrenWhenVisible({
  children,
  staggerDelay = 0.1,
  duration = 0.4,
  initialDelay = 0,
  direction = 'up',
  distance = 20,
  className = '',
  once = true,
  ...props
}: StaggerChildrenProps & { once?: boolean }) {
  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      ...offset,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.4, 0, 0.2, 1] as any,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={containerVariants}
      className={className}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
