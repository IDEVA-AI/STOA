import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';
import type { CardVariant, CardPadding } from '@/src/types/ui';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'card-editorial bg-surface transition-colors duration-500',
  elevated: 'card-editorial bg-surface-elevated transition-colors duration-500 shadow-xl shadow-black/5 border-none shadow-elevated',
  flat: 'bg-surface/30 border border-line transition-colors duration-500',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-6',
  md: 'p-8',
  lg: 'p-10',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'none', interactive = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          interactive && 'hover:border-gold/50 cursor-pointer transition-all duration-700',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Sub-components
export interface CardSectionProps extends ComponentPropsWithoutRef<'div'> {}

const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-10 border-b border-line', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

const CardBody = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-10', className)} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = 'CardBody';

const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-10 border-t border-line', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export { CardHeader, CardBody, CardFooter };
export default Card;
