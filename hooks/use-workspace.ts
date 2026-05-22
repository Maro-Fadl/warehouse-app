'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  planTier: string;
  role: string;
}

interface WorkspaceStore {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      workspaces: [],
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);

export function useWorkspace() {
  const store = useWorkspaceStore();
  return {
    ...store,
    isOwner: store.currentWorkspace?.role === 'owner',
    isManager: store.currentWorkspace?.role === 'manager' || store.currentWorkspace?.role === 'owner',
    isStorekeeper: store.currentWorkspace?.role === 'storekeeper',
    isCashier: store.currentWorkspace?.role === 'cashier',
  };
}
