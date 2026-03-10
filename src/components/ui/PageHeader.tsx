import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface PageHeaderProps extends ComponentPropsWithoutRef<'div'> {
  title: string;
  subtitle?: string;
  label?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}

const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, subtitle, label, actions, breadcrumbs, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex justify-between items-end border-b border-line pb-12', className)}
        {...props}
      >
        <div className="space-y-4">
          {breadcrumbs}
          {label && <p className="mono-label text-gold">{label}</p>}
          <h1 className="font-serif text-6xl font-black tracking-tighter">{title}</h1>
          {subtitle && (
            <p className="text-warm-gray text-lg font-light">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-6">{actions}</div>}
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';
export default PageHeader;
