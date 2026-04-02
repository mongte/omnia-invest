"use client";

import { TaskKanbanBoard } from '@/widgets/board';
import { TaskList } from '@/widgets/task-list/ui/TaskList';
import { CreateProjectDialog } from '@/features/project-management/ui/CreateProjectDialog';
import { useProjectStore } from '@/entities/project/model/store';
import { useTaskStore } from '@/entities/task/model/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { LayoutGrid, List } from 'lucide-react';

export const HomePage = () => {
  const selectedProjectId = useProjectStore(state => state.selectedProjectId);
  const projects = useProjectStore(state => state.projects);
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const clearCompleted = useTaskStore(state => state.clearCompleted);

  const handleClearCompleted = async () => {
    if (selectedProjectId) {
      await clearCompleted(selectedProjectId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-8">
      <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {selectedProject ? `${selectedProject.title} Dashboard` : 'Kanban Board'}
        </h1>
        <div className="flex items-center gap-3">
          {selectedProjectId && (
            <Button variant="outline" onClick={handleClearCompleted}>
              Clear Completed
            </Button>
          )}
          <CreateProjectDialog />
        </div>
      </header>
      <div className="flex-1">
        <Tabs defaultValue="board" className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="board" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="board" className="flex-1 mt-0">
            <TaskKanbanBoard />
          </TabsContent>
          <TabsContent value="list" className="flex-1 mt-0">
            <TaskList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HomePage;
