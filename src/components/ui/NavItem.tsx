import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  layoutId?: string;
}

export default function NavItem({
  icon,
  label,
  active = false,
  onClick,
  className,
  layoutId = "activeNav"
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-3.5 transition-all duration-300 group relative",
        active ? "bg-bg text-gold font-medium" : "text-warm-gray hover:text-text hover:bg-bg/50",
        className
      )}
    >
      <span className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="hidden lg:block text-sm tracking-tight">{label}</span>
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute left-0 w-1 h-full bg-gold"
        />
      )}
    </button>
  );
}
