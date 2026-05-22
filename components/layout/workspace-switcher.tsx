'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const workspaces = [
  { id: '1', name: 'Acme Logistics', slug: 'acme-logistics', plan: 'Retail' },
  { id: '2', name: 'Arabic Trading Co', slug: 'arabic-trading', plan: 'Enterprise' },
];

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(workspaces[0]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3"
      >
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium text-sm">{selected.name}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setSelected(ws);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
                    selected.id === ws.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{ws.name}</div>
                    <div className="text-xs text-muted-foreground">{ws.plan}</div>
                  </div>
                  {selected.id === ws.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
              <div className="border-t border-border mt-2 pt-2">
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
