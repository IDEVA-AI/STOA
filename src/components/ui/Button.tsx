import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';
import type { ButtonVariant, ButtonSize } from '@/src/types/ui';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-text text-bg hover:bg-gold transition-colors duration-500',
  secondary: 'bg-surface border border-line text-text hover:border-gold/50 hover:text-gold transition-all duration-300',
  ghost: 'text-warm-gray hover:text-gold hover:bg-bg/50 transition-all',
  danger: 'bg-danger/10 text-danger hover:bg-danger hover:text-paper transition-colors duration-300',
  link: 'text-gold hover:underline transition-colors p-0',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-10 py-4 text-sm',
};

const iconOnlySizeStyles: Record<ButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconRight,
      iconOnly = false,
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-3 font-bold tracking-tight transition-all',
          variant !== 'link' && (iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size]),
          variant !== 'link' && 'rounded-none',
          variantStyles[variant],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
        {!iconOnly && children}
        {!iconOnly && iconRight}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
