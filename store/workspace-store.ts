import { create } from 'zustand';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  planTier: string;
  subscriptionStatus: string;
  role: string;
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setIsLoading: (loading: boolean) => void;
  refreshWorkspaces: () => Promise<void>;
}

export const useWorkspaceState = create<WorkspaceState>()((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: true,

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  refreshWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/workspaces');
      if (response.ok) {
        const data = await response.json();
        set({ workspaces: data.workspaces });
        if (!get().currentWorkspace && data.workspaces.length > 0) {
          set({ currentWorkspace: data.workspaces[0] });
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
