import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';
import type { BadgeVariant } from '@/src/types/ui';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant;
  count?: number;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-text/90 text-bg',
  gold: 'bg-gold/10 text-gold',
  success: 'bg-emerald-500/10 text-emerald-600',
  muted: 'border border-line text-warm-gray bg-transparent',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', count, className, children, ...props }, ref) => {
    if (count !== undefined) {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black',
            'bg-gold text-paper shadow-lg shadow-gold/20',
            className
          )}
          {...props}
        >
          {count}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center mono-label text-[9px] font-bold tracking-widest px-3 py-1',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
export default Badge;
