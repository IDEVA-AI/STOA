import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface LoadingStateProps extends ComponentPropsWithoutRef<'div'> {
  message?: string;
  description?: string;
  onCancel?: () => void;
}

const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message = 'Carregando...', description, onCancel, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center gap-8 max-w-md text-center', className)}
        {...props}
      >
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <p className="mono-label text-gold text-[10px] animate-pulse">{message}</p>
          {description && (
            <p className="text-warm-gray text-xs font-light italic">{description}</p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-8 text-[10px] mono-label text-warm-gray hover:text-gold transition-colors"
          >
            Cancelar carregamento
          </button>
        )}
      </div>
    );
  }
);
LoadingState.displayName = 'LoadingState';
export default LoadingState;
