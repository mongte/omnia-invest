"use client";

import { useEffect } from 'react';
import { useTaskStore } from '@/entities/task';
import { useAgentStore } from '@/entities/agent';
import { useProjectStore } from '@/entities/project/model/store';
import { TaskCard } from '@/features/task-management';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { Task, TaskStatus } from '@/entities/task/model/types';
import { Loader2 } from 'lucide-react';

const STYLES = {
  'TODO': { label: 'TODO', bgClass: 'bg-[#0ea5e9]' },
  'IN_PROGRESS': { label: 'IN PROGRESS', bgClass: 'bg-[#f59e0b]' },
  'IN_REVIEW': { label: 'IN REVIEW (QA)', bgClass: 'bg-[#ef4444]' },
  'DONE': { label: 'DONE', bgClass: 'bg-[#10b981]' },
} as const;

const KanbanColumn = ({ status, tasks }: { status: TaskStatus, tasks: Task[] }) => {
  const [parent] = useAutoAnimate<HTMLDivElement>();
  const style = STYLES[status];

  return (
    <div className="flex flex-col bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-200/60">
      <div className={`px-4 py-2.5 text-white font-semibold text-sm ${style.bgClass}`}>
        {style.label} ({tasks.length})
      </div>
      <div ref={parent} className="p-4 flex flex-col gap-4 min-h-[600px] transition-all">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export const TaskKanbanBoard = () => {
  const columns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  const tasks = useTaskStore(state => state.tasks);
  const isLoading = useTaskStore(state => state.isLoading);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const fetchAgents = useAgentStore(state => state.fetchAgents);
  const selectedProjectId = useProjectStore(state => state.selectedProjectId);

  // SSE 구독: selectedProjectId가 바뀔 때마다 이전 연결 정리 후 새 projectId로 재구독
  // 데이터 최초 fetch는 ProjectRouteSync에서 담당하므로 여기서는 SSE 실시간 업데이트만 처리
  useEffect(() => {
    if (!selectedProjectId) return;

    const eventSource = new EventSource(`/api/stream?projectId=${selectedProjectId}`);

    eventSource.onmessage = (event: MessageEvent<string>) => {
      if (event.data === 'update') {
        // silent=true로 UI 깜빡임 없이 갱신
        fetchTasks(selectedProjectId, true);
        fetchAgents(selectedProjectId, true);
      }
    };

    eventSource.onerror = () => {
      // EventSource는 onerror 후 자동 재연결함. close() 호출하면 재연결 차단되므로 호출하지 않음.
    };

    return () => {
      eventSource.close();
    };
  }, [selectedProjectId, fetchTasks, fetchAgents]);

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <p className="text-lg font-medium">프로젝트를 선택해주세요</p>
        <p className="text-sm mt-1">사이드바에서 프로젝트를 클릭하면 해당 칸반보드가 열립니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-500" />
        <p className="text-sm font-medium">프로젝트 데이터 로드 중...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
      {columns.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);
        return <KanbanColumn key={status} status={status} tasks={columnTasks} />;
      })}
    </div>
  );
};
