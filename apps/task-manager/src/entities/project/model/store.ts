import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Project {
  id: string;
  title: string;
  color: string;
  icon?: string;
}

export interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProjectActions {
  fetchProjects: () => Promise<void>;
  createProject: (data: Omit<Project, 'id'>) => Promise<void>;
  deleteProject: (id: string, onSuccess?: (newSelectedId: string | null) => void) => Promise<void>;
  selectProject: (id: string) => void;
  clearError: () => void;
}

export type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector((set, get) => ({
    projects: [],
    selectedProjectId: null,
    isLoading: false,
    error: null,

    fetchProjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const projects = await res.json();
        const list: Project[] = Array.isArray(projects) ? projects : [];
        // selectedProjectId는 ProjectRouteSync(URL 기반)가 관리하므로 여기서 덮어쓰지 않음
        // projects 목록만 업데이트하고 선택 상태는 건드리지 않는다
        set({ projects: list, isLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message, isLoading: false });
      }
    },

    createProject: async (data) => {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create project');
        const newProject = await res.json() as Project;
        set({ projects: [...get().projects, newProject] });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
      }
    },

    deleteProject: async (id, onSuccess) => {
      const previousProjects = get().projects;
      const remainingProjects = previousProjects.filter(p => p.id !== id);
      // If deleting the selected project, auto-select the first remaining project
      const currentSelected = get().selectedProjectId;
      const newSelected =
        currentSelected === id ? (remainingProjects[0]?.id ?? null) : currentSelected;

      // Optimistic update: immediately reflect deletion in UI
      set({ projects: remainingProjects, selectedProjectId: newSelected, error: null });

      try {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          // Rollback on failure
          set({ projects: previousProjects, selectedProjectId: currentSelected });
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? 'Failed to delete project');
        }
        // Notify caller so UI layer can handle routing (e.g. router.push)
        onSuccess?.(newSelected);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
      }
    },

    selectProject: (id) => {
      set({ selectedProjectId: id });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);
