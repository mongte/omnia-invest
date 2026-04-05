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
  updateTaskAssignee: (taskId: string, assigneeId: string | undefined, projectId: string) => Promise<void>;
  addComment: (taskId: string, agentId: string, content: string, projectId: string) => Promise<void>;
  clearCompleted: (projectId: string) => Promise<void>;
  deleteTask: (taskId: string, projectId: string) => Promise<void>;
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
        const data: unknown = await res.json();
        const tasks = Array.isArray(data) ? data : [];
        set({ tasks, isLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message, isLoading: false });
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

        // SSE도 fetchTasks를 트리거하지만, 즉시 반영을 위해 명시적 호출
        await get().fetchTasks(projectId, true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
      }
    },

    updateTaskAssignee: async (taskId: string, assigneeId: string | undefined, projectId: string) => {
      try {
        // Optimistic update
        set({
          tasks: get().tasks.map(t => (t.id === taskId ? { ...t, assigneeId } : t)),
        });

        const taskToUpdate = get().tasks.find(t => t.id === taskId);
        if (!taskToUpdate) throw new Error('Task not found');

        // title/description 제외하고 id, assigneeId, status만 전송
        // assigneeId가 undefined인 경우(해제) null로 명시하여 서버에서 필드를 제거
        const payload: Record<string, unknown> = { id: taskId, status: taskToUpdate.status };
        if (assigneeId !== undefined) {
          payload.assigneeId = assigneeId;
        } else {
          payload.assigneeId = null;
        }
        const res = await fetch(`/api/tasks?projectId=${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await get().fetchTasks(projectId);
          throw new Error('Failed to update assignee');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
      }
    },

    addComment: async (taskId: string, agentId: string, content: string, projectId: string) => {
      const previousTasks = get().tasks;
      const optimisticComment = {
        id: `comment-optimistic-${Date.now()}`,
        agentId,
        content,
        createdAt: new Date().toISOString(),
      };
      try {
        // Optimistic update
        set({
          tasks: get().tasks.map(t =>
            t.id === taskId
              ? { ...t, comments: [...(t.comments ?? []), optimisticComment] }
              : t
          ),
        });

        const res = await fetch(`/api/tasks/comments?projectId=${projectId}&taskId=${taskId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, agentId, content }),
        });

        if (!res.ok) {
          set({ tasks: previousTasks });
          throw new Error('Failed to add comment');
        }

        // 실제 서버 응답으로 갱신 (optimistic id 교체)
        await get().fetchTasks(projectId, true);
      } catch (err) {
        set({ tasks: previousTasks });
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
      }
    },

    deleteTask: async (taskId: string, projectId: string) => {
      const previousTasks = get().tasks;
      try {
        // Optimistic update
        set({
          tasks: previousTasks.filter(t => t.id !== taskId),
        });

        const res = await fetch(`/api/tasks?projectId=${projectId}&taskId=${taskId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          set({ tasks: previousTasks });
          await get().fetchTasks(projectId);
          throw new Error('Failed to delete task');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message, tasks: previousTasks });
      }
    },
  }))
);
