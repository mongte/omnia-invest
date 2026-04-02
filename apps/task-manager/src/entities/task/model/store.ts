import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Task, TaskStatus } from './types';

export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

export interface TaskActions {
  setTasks: (tasks: Task[]) => void;
  fetchTasks: (projectId: string, silent?: boolean) => Promise<void>;
  addTask: (task: Task, projectId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, projectId: string) => Promise<void>;
  clearCompleted: (projectId: string) => Promise<void>;
}

export type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    setTasks: (tasks) => set({ tasks }),

    fetchTasks: async (projectId: string, silent = false) => {
      if (!silent) {
        set({ isLoading: true, error: null, tasks: [] });
      } else {
        set({ error: null });
      }
      try {
        const res = await fetch(`/api/tasks?projectId=${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const tasks = await res.json();
        set({ tasks: tasks || [], isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    addTask: async (task: Task, projectId: string) => {
      try {
        const newTask = {
          ...task,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
        };

        const res = await fetch(`/api/tasks?projectId=${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
        });

        if (!res.ok) throw new Error('Failed to add task');

        const createdTask = await res.json();
        set({ tasks: [...get().tasks, createdTask] });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    updateTaskStatus: async (taskId: string, status: TaskStatus, projectId: string) => {
      try {
        // Optimistic update
        set({
          tasks: get().tasks.map(t => (t.id === taskId ? { ...t, status } : t)),
        });

        const taskToUpdate = get().tasks.find(t => t.id === taskId);
        if (!taskToUpdate) throw new Error('Task not found');

        const res = await fetch(`/api/tasks?projectId=${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskToUpdate, status }),
        });

        if (!res.ok) {
          await get().fetchTasks(projectId);
          throw new Error('Failed to update task');
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    clearCompleted: async (projectId: string) => {
      try {
        // Optimistic update
        set({
          tasks: get().tasks.filter(t => t.status !== 'DONE'),
        });

        const res = await fetch(`/api/tasks/clear-completed?projectId=${projectId}`, {
          method: 'POST',
        });

        if (!res.ok) {
          await get().fetchTasks(projectId);
          throw new Error('Failed to clear completed tasks');
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    },
  }))
);
