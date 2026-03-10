import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AdminNavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  hasSubmenu?: boolean;
}

export default function AdminNavItem({
  icon,
  label,
  active = false,
  hasSubmenu = false
}: AdminNavItemProps) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between px-4 py-3 transition-all duration-300 group",
      active ? "bg-bg text-text font-medium" : "text-warm-gray hover:text-text hover:bg-bg/50"
    )}>
      <div className="flex items-center gap-3">
        <span className={cn("transition-colors", active ? "text-gold" : "group-hover:text-gold")}>
          {icon}
        </span>
        <span className="text-sm tracking-tight">{label}</span>
      </div>
      {hasSubmenu && <ChevronRight size={14} className="text-warm-gray/40" />}
    </button>
  );
}
