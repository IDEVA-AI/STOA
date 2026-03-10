import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface ToggleProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onChange, label, disabled, className, ...props }, ref) => {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        {label && <span className="text-sm">{label}</span>}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            'w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300',
            checked ? 'bg-gold' : 'bg-line',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        >
          <div
            className={cn(
              'absolute top-1 w-3 h-3 bg-paper rounded-full transition-all duration-300',
              checked ? 'right-1' : 'left-1'
            )}
          />
        </button>
      </div>
    );
  }
);
Toggle.displayName = 'Toggle';
export default Toggle;
