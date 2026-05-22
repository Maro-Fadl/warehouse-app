'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  BarChart3,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    label: 'Dashboard',
    href: '/[workspace]',
    icon: LayoutDashboard,
  },
  {
    label: 'Inventory',
    href: '/[workspace]/inventory',
    icon: Package,
  },
  {
    label: 'Warehouses',
    href: '/[workspace]/warehouses',
    icon: Warehouse,
  },
  {
    label: 'POS',
    href: '/[workspace]/pos',
    icon: ShoppingCart,
  },
  {
    label: 'Analytics',
    href: '/[workspace]/analytics',
    icon: BarChart3,
  },
  {
    label: 'AI Assistant',
    href: '/[workspace]/ai-assistant',
    icon: Bot,
  },
  {
    label: 'Settings',
    href: '/[workspace]/settings',
    icon: Settings,
  },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Extract workspace from pathname
  const workspaceMatch = pathname.match(/\/([^/]+)/);
  const workspace = workspaceMatch ? workspaceMatch[1] : 'default';

  const isActive = (href: string) => {
    const resolvedHref = href.replace('[workspace]', workspace);
    if (resolvedHref === `/${workspace}`) {
      return pathname === `/${workspace}` || pathname === `/${workspace}/`;
    }
    return pathname.startsWith(resolvedHref);
  };

  return (
    <motion.aside
      animate={{ width: open ? 280 : 72 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col border-r border-border bg-sidebar h-screen"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href={`/${workspace}`} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Boxes className="h-5 w-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg whitespace-nowrap overflow-hidden"
              >
                WareHouse Pro
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const href = item.href.replace('[workspace]', workspace);

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-primary')} />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-8 rounded-r-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        {open ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  );
}
