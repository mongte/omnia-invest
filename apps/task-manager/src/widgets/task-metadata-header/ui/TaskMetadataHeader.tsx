import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Task } from '@/entities/task';
import { Clock, PlayCircle } from 'lucide-react';

interface Props {
  task: Task;
}

export const TaskMetadataHeader = ({ task }: Props) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              {task.title}
              <Badge variant={task.status === 'DONE' ? 'default' : 'secondary'}>{task.status}</Badge>
            </CardTitle>
            <p className="text-sm text-foreground/60 mt-2">
              <span className="font-semibold text-foreground">Spec: </span>
              {task.description}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground/50" />
              <div className="flex flex-col">
                <span className="text-xs text-foreground/50">Started</span>
                <span className="text-sm font-medium">--</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-foreground/50 mb-1">Assigned Agent</span>
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium">{task.assigneeId || 'Unassigned'}</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> Active
                  </span>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${task.assigneeId}`} />
                  <AvatarFallback>AG</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
