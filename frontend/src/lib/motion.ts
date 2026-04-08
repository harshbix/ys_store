import type { Variants } from 'framer-motion';

// Tokens
export const TRANSITIONS = {
  SPRING: { type: 'spring', stiffness: 520, damping: 32 } as const,
  EASE_OUT: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } as const,
  FAST_EASE: { duration: 0.15, ease: 'easeOut' } as const
};

// Interactions
export const tapScale = { scale: 0.985, y: 1 } as const;
export const springPress = TRANSITIONS.SPRING;

// Reveals
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.EASE_OUT
  }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

export const gridStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.01
    }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITIONS.FAST_EASE }
};

// UI Elements
export const drawerMotion: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', bounce: 0, duration: 0.4 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' } }
};

export const modalMotion: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: TRANSITIONS.EASE_OUT },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: TRANSITIONS.FAST_EASE }
};

