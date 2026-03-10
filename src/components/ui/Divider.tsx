import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface DividerProps extends ComponentPropsWithoutRef<'hr'> {}

const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn('border-t border-line', className)}
        {...props}
      />
    );
  }
);
Divider.displayName = 'Divider';
export default Divider;
