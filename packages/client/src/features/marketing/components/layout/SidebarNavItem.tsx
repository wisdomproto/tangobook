import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SidebarNavItemProps {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}

export function SidebarNavItem({ to, icon, label, badge }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )
      }
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
