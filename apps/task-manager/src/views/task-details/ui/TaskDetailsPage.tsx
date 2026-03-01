"use client";

import { useTaskStore } from '@/entities/task';
import { TaskMetadataHeader } from '@/widgets/task-metadata-header';
import { TaskWorkLog } from '@/widgets/task-work-log';
import { TaskArtifactsViewer } from '@/widgets/task-artifacts';
import { QAControls } from '@/features/qa-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export const TaskDetailsPage = ({ taskId }: { taskId: string }) => {
  const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));

  if (!task) {
    return <div className="p-6 text-center text-muted-foreground mt-20">Task not found. Please sync with Supabase or check the ID.</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto p-4 md:p-8">
      <TaskMetadataHeader task={task} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-2 flex flex-col min-w-0">
          <Tabs defaultValue="log" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
              <TabsTrigger value="log">Activity & Work Log</TabsTrigger>
              <TabsTrigger value="artifacts">Artifact & Diff View</TabsTrigger>
            </TabsList>
            <TabsContent value="log" className="mt-0">
              <TaskWorkLog />
            </TabsContent>
            <TabsContent value="artifacts" className="mt-0">
              <TaskArtifactsViewer />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar / QA Controls Area - Sticky on Desktop */}
        <div className="lg:col-span-1 lg:sticky lg:top-8 w-full">
          <QAControls taskId={taskId} />
        </div>
      </div>
    </div>
  );
};
