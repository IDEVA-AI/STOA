import { forwardRef, type ComponentPropsWithoutRef, type ElementType } from 'react';
import { cn } from '@/src/lib/utils';
import type { HeadingLevel, TextSize } from '@/src/types/ui';

// --- Heading ---

export interface HeadingProps extends ComponentPropsWithoutRef<'h1'> {
  level?: HeadingLevel;
  as?: ElementType;
}

const headingStyles: Record<HeadingLevel, string> = {
  1: 'serif-display text-6xl',
  2: 'font-serif text-3xl font-black tracking-tighter',
  3: 'font-serif text-2xl font-black tracking-tight',
  4: 'font-serif text-xl font-bold',
};

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 1, as, className, children, ...props }, ref) => {
    const Tag = as ?? (`h${level}` as ElementType);
    return (
      <Tag ref={ref} className={cn(headingStyles[level], className)} {...props}>
        {children}
      </Tag>
    );
  }
);
Heading.displayName = 'Heading';

// --- Text ---

export interface TextProps extends ComponentPropsWithoutRef<'p'> {
  size?: TextSize;
  muted?: boolean;
  as?: 'p' | 'span';
}

const textSizeStyles: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ size = 'md', muted = false, as: Tag = 'p', className, children, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(textSizeStyles[size], muted && 'text-warm-gray', className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
Text.displayName = 'Text';

// --- Label ---

export interface LabelProps extends ComponentPropsWithoutRef<'span'> {
  variant?: 'default' | 'gold';
}

const Label = forwardRef<HTMLSpanElement, LabelProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'mono-label text-[10px]',
          variant === 'default' ? 'text-warm-gray' : 'text-gold font-bold',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Label.displayName = 'Label';

export { Heading, Text, Label };
