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
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  workspaceSlug: string;
}

const menuItems = [
  {
    label: 'Dashboard',
    href: '',
    icon: LayoutDashboard,
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: Package,
  },
  {
    label: 'Warehouses',
    href: '/warehouses',
    icon: Warehouse,
  },
  {
    label: 'POS',
    href: '/pos',
    icon: ShoppingCart,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'AI Assistant',
    href: '/ai-assistant',
    icon: Bot,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ open, onToggle, workspaceSlug }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const fullPath = `/${workspaceSlug}${href}`;
    if (fullPath === `/${workspaceSlug}`) {
      return pathname === `/${workspaceSlug}` || pathname === `/${workspaceSlug}/`;
    }
    return pathname.startsWith(fullPath);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: open ? 280 : 0,
          x: open ? 0 : -280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed lg:relative z-50 lg:z-auto flex flex-col border-r border-border bg-sidebar h-screen overflow-hidden',
          'lg:translate-x-0'
        )}
        style={{ width: open ? 280 : 0 }}
      >
        <div className="flex flex-col h-full w-[280px]">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
            <Link href={`/${workspaceSlug}`} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Boxes className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg whitespace-nowrap">
                WareHouse Pro
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              const href = `/${workspaceSlug}${item.href}`;

              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-primary')} />
                  <span className="whitespace-nowrap text-sm">
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Toggle button - desktop only */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border items-center justify-center hover:bg-muted transition-colors z-10"
        >
          {open ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      </motion.aside>
    </>
  );
}
