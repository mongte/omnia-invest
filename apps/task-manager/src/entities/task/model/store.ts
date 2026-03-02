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
  fetchTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,
    
    setTasks: (tasks) => set({ tasks }),
    
    fetchTasks: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const tasks = await res.json();
        set({ tasks: tasks || [], isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    addTask: async (task) => {
      try {
        const newTask = {
          ...task,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString()
        };

        const res = await fetch('/api/tasks', {
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
    
    updateTaskStatus: async (taskId, status) => {
      try {
        // Optimistic update
        set({
          tasks: get().tasks.map(t => t.id === taskId ? { ...t, status } : t)
        });
        
        const taskToUpdate = get().tasks.find(t => t.id === taskId);
        if (!taskToUpdate) throw new Error('Task not found');
        
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskToUpdate, status }),
        });

        if (!res.ok) {
          // Revert on failure
          await get().fetchTasks();
          throw new Error('Failed to update task');
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    }
  }))
);
