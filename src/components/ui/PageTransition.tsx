import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { pageTransition } from '@/src/lib/motion';

export interface PageTransitionProps {
  id: string;
  className?: string;
  children: ReactNode;
}

export default function PageTransition({ id, className, children }: PageTransitionProps) {
  return (
    <motion.div
      key={id}
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
