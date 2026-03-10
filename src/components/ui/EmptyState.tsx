import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface EmptyStateProps extends ComponentPropsWithoutRef<'div'> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-32 space-y-8 opacity-40',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-warm-gray/30 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="text-center space-y-2">
          <h3 className="font-serif text-3xl font-black tracking-tighter">{title}</h3>
          {description && (
            <p className="mono-label text-[10px] tracking-widest uppercase">{description}</p>
          )}
        </div>
        {action}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
export default EmptyState;
