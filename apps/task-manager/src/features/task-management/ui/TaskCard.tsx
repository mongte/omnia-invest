import { Task } from '@/entities/task';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { MessageSquare, Calendar, Edit2, Users } from 'lucide-react';
import Link from 'next/link';

export const TaskCard = ({ task }: { task: Task }) => {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="mb-0 border border-slate-200/60 shadow-sm rounded-lg hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
        <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-slate-800">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col gap-3">
        <p className="text-xs text-slate-500 leading-snug">{task.description}</p>
        
        <div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] px-2.5 py-0.5">
            Project Alpha
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">
              {task.assigneeId ? task.assigneeId.substring(0, 2).toUpperCase() : 'UN'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 leading-tight">Assigned Agent:</span>
            <span className="text-xs font-semibold text-slate-800 leading-tight">{task.assigneeId || 'Unassigned'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer transition-colors" />
            <Edit2 className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer transition-colors" />
            <MessageSquare className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer transition-colors" />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Dec</span>
          </div>
        </div>
          </CardContent>
      </Card>
    </Link>
  );
};
