import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';
import type { TextareaVariant } from '@/src/types/ui';

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  variant?: TextareaVariant;
  label?: string;
  error?: string;
  hint?: string;
}

const variantStyles: Record<TextareaVariant, string> = {
  default:
    'bg-bg border border-line px-4 py-3 focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all text-sm resize-none',
  editorial:
    'bg-transparent border-none focus:ring-0 focus:outline-none text-2xl resize-none placeholder:text-warm-gray/20 font-serif italic leading-tight',
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = 'default', label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mono-label text-[10px] text-warm-gray block mb-1.5">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn('w-full', variantStyles[variant], error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20', className)}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {hint && !error && <p className="text-warm-gray text-xs mt-1">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
export default Textarea;
