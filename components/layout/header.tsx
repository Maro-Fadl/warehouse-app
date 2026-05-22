'use client';

import { Bell, Search, Menu, LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { WorkspaceSwitcher } from './workspace-switcher';
import { LanguageToggle } from './language-toggle';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  onMenuToggle: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function Header({ onMenuToggle, user }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <WorkspaceSwitcher />

        {/* Search - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground w-64 cursor-pointer hover:border-primary/50 transition-colors">
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile search */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Search className="h-5 w-5" />
        </Button>

        {/* Language toggle */}
        <LanguageToggle />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </Button>

        {/* User menu */}
        <div className="flex items-center gap-2 ml-1 md:ml-2 pl-1 md:pl-2 border-l border-border">
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium">{user?.name || 'User'}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role || 'Member'}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {user?.image ? (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
