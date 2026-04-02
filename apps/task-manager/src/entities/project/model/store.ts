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
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string) => void;
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
        // Auto-select first project if none selected
        const currentId = get().selectedProjectId;
        const selectedId = list.find(p => p && p.id === currentId)
          ? currentId
          : null;
        set({ projects: list, isLoading: false, selectedProjectId: selectedId });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
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
        const newProject = await res.json();
        set({ projects: [...get().projects, newProject] });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    deleteProject: async (id) => {
      try {
        const previousProjects = get().projects;
        const remainingProjects = previousProjects.filter(p => p.id !== id);
        // If deleting the selected project, select another
        const currentSelected = get().selectedProjectId;
        const newSelected =
          currentSelected === id ? (remainingProjects[0]?.id ?? null) : currentSelected;
        set({ projects: remainingProjects, selectedProjectId: newSelected });

        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          set({ projects: previousProjects });
          throw new Error('Failed to delete project');
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    selectProject: (id) => {
      set({ selectedProjectId: id });
    },
  }))
);
