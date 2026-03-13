import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';
import type { InputVariant } from '@/src/types/ui';

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  variant?: InputVariant;
  icon?: ReactNode;
  iconRight?: ReactNode;
  label?: string;
  error?: string;
  hint?: string;
}

const variantStyles: Record<InputVariant, string> = {
  default: 'bg-bg border border-line px-4 py-2.5 sm:py-3 focus:border-gold focus:outline-none transition-colors text-sm',
  ghost: 'bg-transparent border-none focus:ring-0 focus:outline-none text-sm',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', icon, iconRight, label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mono-label text-[10px] text-warm-gray block mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray/40">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full',
              variantStyles[variant],
              icon && 'pl-10 sm:pl-11',
              iconRight && 'pr-10 sm:pr-11',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/40">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {hint && !error && <p className="text-warm-gray text-xs mt-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
