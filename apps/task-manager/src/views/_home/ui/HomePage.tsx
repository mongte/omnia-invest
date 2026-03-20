"use client";

import { TaskKanbanBoard } from '@/widgets/board';
import { CreateProjectDialog } from '@/features/project-management/ui/CreateProjectDialog';
import { useProjectStore } from '@/entities/project/model/store';

export const HomePage = () => {
  const selectedProjectId = useProjectStore(state => state.selectedProjectId);
  const projects = useProjectStore(state => state.projects);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex flex-col h-full bg-white p-8">
      <header className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {selectedProject ? `${selectedProject.title} Dashboard` : 'Kanban Board'}
        </h1>
        <CreateProjectDialog />
      </header>
      <div className="flex-1">
        <TaskKanbanBoard />
      </div>
    </div>
  );
};

export default HomePage;
