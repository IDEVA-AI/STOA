import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/src/lib/utils';
import type { Size } from '@/src/types/ui';

export interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
  name: string;
  src?: string;
  size?: Size;
  variant?: 'default' | 'gold';
  status?: 'online' | 'offline';
  interactive?: boolean;
}

const sizeStyles: Record<Size, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[8px]', status: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2.5 h-2.5 border-[1.5px]' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-3 h-3 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-sm', status: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-14 h-14', text: 'text-2xl', status: 'w-4 h-4 border-2' },
  '2xl': { container: 'w-32 h-32', text: 'text-4xl', status: 'w-5 h-5 border-[3px]' },
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = 'md', variant = 'default', status, interactive = false, className, ...props }, ref) => {
    const initial = name[0]?.toUpperCase() ?? '?';
    const s = sizeStyles[size];

    return (
      <div ref={ref} className={cn('relative inline-flex flex-shrink-0', className)} {...props}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden',
            s.container,
            variant === 'default' ? 'bg-text' : 'bg-gold',
            interactive && 'hover:bg-gold hover:rotate-12 cursor-pointer group'
          )}
        >
          {src ? (
            <img src={src} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span
              className={cn(
                'font-serif font-bold',
                s.text,
                variant === 'default'
                  ? cn('text-gold font-black', interactive && 'group-hover:text-paper')
                  : 'text-paper font-black'
              )}
            >
              {initial}
            </span>
          )}
        </div>
        {status && (
          <div
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-surface',
              s.status,
              status === 'online' ? 'bg-success' : 'bg-warm-gray/40'
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
export default Avatar;
