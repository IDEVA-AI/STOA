import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { progressFill } from '@/src/lib/motion';
import type { ProgressBarSize } from '@/src/types/ui';

export interface ProgressBarProps extends ComponentPropsWithoutRef<'div'> {
  value: number;
  size?: ProgressBarSize;
  showLabel?: boolean;
  animated?: boolean;
  glow?: boolean;
}

const sizeStyles: Record<ProgressBarSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
};

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, size = 'sm', showLabel = false, animated = true, glow = true, className, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    const fill = progressFill(clamped);

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] mono-label text-warm-gray/60">Progresso</span>
            <span className="font-mono text-[10px] text-gold font-bold">{clamped}%</span>
          </div>
        )}
        <div className={cn('bg-line/30 relative overflow-hidden rounded-full', sizeStyles[size])}>
          <motion.div
            initial={animated ? fill.initial : false}
            animate={animated ? fill.animate : { width: `${clamped}%` }}
            transition={animated ? fill.transition : undefined}
            className={cn(
              'absolute top-0 left-0 h-full bg-gold',
              glow && 'shadow-[0_0_8px_rgba(184,135,58,0.3)]'
            )}
          />
        </div>
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';
export default ProgressBar;
