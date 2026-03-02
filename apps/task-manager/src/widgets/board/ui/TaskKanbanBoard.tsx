"use client";

import { useEffect } from 'react';
import { useTaskStore } from '@/entities/task';
import { useAgentStore } from '@/entities/agent';
import { TaskCard } from '@/features/task-management';

const STYLES = {
  'TODO': { label: 'TODO', bgClass: 'bg-[#0ea5e9]' },
  'IN_PROGRESS': { label: 'IN PROGRESS', bgClass: 'bg-[#f59e0b]' },
  'IN_REVIEW': { label: 'IN REVIEW (QA)', bgClass: 'bg-[#ef4444]' },
  'DONE': { label: 'DONE', bgClass: 'bg-[#10b981]' },
} as const;

export const TaskKanbanBoard = () => {
  const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
  
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const fetchAgents = useAgentStore(state => state.fetchAgents);

  useEffect(() => {
    // Initial fetch
    fetchTasks();
    fetchAgents();

    // Subscribe to real-time updates
    const eventSource = new EventSource('/api/stream');
    
    eventSource.onmessage = (event) => {
      console.log('SSE EVENT:', event.data);
      if (event.data === 'update') {
        fetchTasks();
        fetchAgents();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchTasks, fetchAgents]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
      {columns.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);
        const style = STYLES[status];
        
        return (
          <div key={status} className="flex flex-col bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-200/60">
            <div className={`px-4 py-2.5 text-white font-semibold text-sm ${style.bgClass}`}>
              {style.label} ({columnTasks.length})
            </div>
            <div className="p-4 flex flex-col gap-4 min-h-[600px]">
              {columnTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
