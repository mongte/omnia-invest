import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';

export const TaskArtifactsViewer = () => {
  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Generated Code Diffs & Output</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-2">src/widgets/sidebar/ui/Sidebar.tsx</h3>
            <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto text-green-700 dark:text-green-500">
{`+ export const Sidebar = () => {
+   return <nav>My Sidebar</nav>;
+ };`}
            </pre>
            
            <h3 className="text-sm font-semibold mt-6 mb-2">src/widgets/board/ui/TaskKanbanBoard.tsx</h3>
            <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
{`  export const TaskKanbanBoard = () => {
-   const columns = ['TODO', 'IN_PROGRESS'];
+   const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    return <div>Board</div>;
  };`}
            </pre>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
