import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface FormGroupProps extends ComponentPropsWithoutRef<'div'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  labelAction?: ReactNode;
}

const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  ({ label, error, hint, required, labelAction, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {(label || labelAction) && (
          <div className="flex justify-between items-center">
            {label && (
              <label className="mono-label text-[10px] text-warm-gray">
                {label}
                {required && <span className="text-gold ml-1">*</span>}
              </label>
            )}
            {labelAction}
          </div>
        )}
        {children}
        {error && <p className="text-red-500 text-xs">{error}</p>}
        {hint && !error && <p className="text-warm-gray text-xs">{hint}</p>}
      </div>
    );
  }
);
FormGroup.displayName = 'FormGroup';
export default FormGroup;
