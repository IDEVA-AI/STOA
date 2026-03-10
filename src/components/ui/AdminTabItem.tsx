import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface AdminTabItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
}

export default function AdminTabItem({
  icon,
  label,
  active = false
}: AdminTabItemProps) {
  return (
    <button className={cn(
      "flex items-center gap-2 px-1 py-4 transition-all duration-300 group relative whitespace-nowrap",
      active ? "text-text font-bold" : "text-warm-gray hover:text-text"
    )}>
      <span className={cn("transition-colors", active ? "text-gold" : "group-hover:text-gold")}>
        {icon}
      </span>
      <span className="text-[9px] mono-label tracking-widest">{label}</span>
      {active && (
        <motion.div
          layoutId="activeAdminTab"
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gold"
        />
      )}
    </button>
  );
}
