import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { FilePlus, FileEdit, Bug, Terminal, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type EventType = 'command' | 'create_file' | 'edit_file' | 'issue' | 'status_change';

export interface AgentEvent {
  id: string;
  type: EventType;
  timestamp: string;
  message: string;
  details?: string;
  path?: string;
  reason?: string;
  rootCause?: string;
  resolution?: string;
}

const MOCK_EVENTS: AgentEvent[] = [
  { id: '1', type: 'status_change', timestamp: '10:00 AM', message: 'Task marked as In Progress' },
  { id: '2', type: 'command', timestamp: '10:01 AM', message: 'Ran command: npm install framer-motion', details: 'Added 1 package, removed 0 packages.' },
  { id: '3', type: 'create_file', timestamp: '10:05 AM', message: 'Created Sidebar Widget', path: 'src/widgets/sidebar/ui/Sidebar.tsx', reason: 'Required to build the main navigation matching the Stitch design.' },
  { id: '4', type: 'issue', timestamp: '10:15 AM', message: 'Build error encountered: "module not found"', rootCause: 'Nx turbopack was not resolving @nx/react/tailwind internally.', resolution: 'Removed problematic config from tailwind.config.js and manually mapped theme variables.' },
  { id: '5', type: 'edit_file', timestamp: '10:20 AM', message: 'Refactored Kanban Board', path: 'src/widgets/board/ui/TaskKanbanBoard.tsx', reason: 'Updated grid layout to match 4 columns per the new design guidelines.' },
];

export const TaskWorkLog = () => {
  const getIcon = (type: EventType) => {
    switch(type) {
      case 'command': return <Terminal className="w-4 h-4 text-blue-500" />;
      case 'create_file': return <FilePlus className="w-4 h-4 text-green-500" />;
      case 'edit_file': return <FileEdit className="w-4 h-4 text-orange-500" />;
      case 'issue': return <Bug className="w-4 h-4 text-red-500" />;
      case 'status_change': return <Play className="w-4 h-4 text-purple-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Activity Stream & Work Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6">
          <div className="flex flex-col gap-6 pb-6">
            {MOCK_EVENTS.map((event, index) => (
              <div key={event.id} className="relative pl-6">
                {/* Timeline line */}
                {index !== MOCK_EVENTS.length - 1 && (
                  <div className="absolute left-[11px] top-6 w-[2px] h-[calc(100%+24px)] bg-border" />
                )}
                
                {/* Timeline Icon */}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border flex items-center justify-center">
                  {getIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{event.message}</span>
                    <span className="text-xs text-foreground/50">{event.timestamp}</span>
                  </div>

                  {event.path && (
                    <div className="text-sm">
                      <span className="text-foreground/60 font-medium">Path: </span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{event.path}</code>
                    </div>
                  )}

                  {event.reason && (
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <span className="font-medium">Reasoning: </span>
                      <span className="text-foreground/80">{event.reason}</span>
                    </div>
                  )}
                  
                  {event.type === 'issue' && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 rounded-md flex flex-col gap-3">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 dark:text-red-400">Root Cause Analysis</p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{event.rootCause}</p>
                        </div>
                      </div>
                      <Separator className="bg-red-200 dark:bg-red-900" />
                      <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-500">Resolution</p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">{event.resolution}</p>
                      </div>
                    </div>
                  )}

                  {event.details && event.type !== 'issue' && (
                    <div className="text-sm text-foreground/60">
                      {event.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
