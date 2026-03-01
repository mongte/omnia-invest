import { TaskKanbanBoard } from '@/widgets/board';

export const HomePage = () => {
  return (
    <div className="flex flex-col h-full bg-white p-8">
      <header className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Alpha Dashboard</h1>
      </header>
      <div className="flex-1">
        <TaskKanbanBoard />
      </div>
    </div>
  );
};

export default HomePage;
