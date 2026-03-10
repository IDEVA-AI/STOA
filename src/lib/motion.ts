import type { Transition, Variants } from 'motion/react';

// Page transition — fade + slide for page switches
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const pageTransitionConfig: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

// List item stagger — for animated lists
export function listItem(index: number): {
  initial: Record<string, number>;
  animate: Record<string, number>;
  transition: Transition;
} {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  };
}

// Progress bar fill animation
export function progressFill(percent: number): {
  initial: { width: 0 };
  animate: { width: string };
  transition: Transition;
} {
  return {
    initial: { width: 0 },
    animate: { width: `${percent}%` },
    transition: { duration: 1.5, ease: 'circOut' },
  };
}

// Directional fade
export function fadeIn(direction: 'up' | 'down' | 'left' | 'right' = 'up'): Variants {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const value = direction === 'down' || direction === 'right' ? -10 : 10;

  return {
    initial: { opacity: 0, [axis]: value },
    animate: { opacity: 1, [axis]: 0 },
    exit: { opacity: 0, [axis]: -value },
  };
}

// Popover / dropdown animation
export const popover: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.95 },
};

export const popoverTransition: Transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

// Spring config for layoutId animations
export const layoutSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};
