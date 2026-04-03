import type { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.04
    }
  }
};

export const drawerMotion: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', bounce: 0.1, duration: 0.35 } },
  exit: { x: '100%', transition: { duration: 0.2 } }
};
