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
        className={cn('flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-line pb-8 sm:pb-12', className)}
        {...props}
      >
        <div className="space-y-4">
          {breadcrumbs}
          {label && <p className="mono-label text-gold">{label}</p>}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter">{title}</h1>
          {subtitle && (
            <p className="text-warm-gray text-lg font-light">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-4 sm:gap-6 w-full sm:w-auto">{actions}</div>}
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';
export default PageHeader;
