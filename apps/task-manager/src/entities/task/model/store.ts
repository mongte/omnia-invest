import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Task, TaskStatus } from './types';
import { supabase } from '@/shared/api/supabase';

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
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        // Transform snake_case from DB to camelCase if needed, assuming camelCase for now or matching exactly
        const formattedTasks = data?.map(t => ({
          ...t,
          assigneeId: t.assignee_id,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        })) as Task[];
        set({ tasks: formattedTasks || [], isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    addTask: async (task) => {
      try {
        const { data, error } = await supabase.from('tasks').insert([{
          title: task.title,
          description: task.description,
          status: task.status,
          assignee_id: task.assigneeId
        }]).select();
        
        if (error) throw error;
        
        if (data) {
          const newTask = {
            ...data[0],
            assigneeId: data[0].assignee_id,
            createdAt: data[0].created_at,
            updatedAt: data[0].updated_at
          } as Task;
          set({ tasks: [...get().tasks, newTask] });
        }
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
        
        const { error } = await supabase
          .from('tasks')
          .update({ status })
          .eq('id', taskId);
          
        if (error) {
          // Rever on failure
          await get().fetchTasks();
          throw error;
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    }
  }))
);
