import { Task } from '@/entities/task';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { MessageSquare, Calendar, Edit2, Users } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { useAgentStore } from '@/entities/agent';

export const TaskCard = ({ task }: { task: Task }) => {
  const agents = useAgentStore(state => state.agents);
  const assigneeInfo = agents.find(a => a.id === task.assigneeId);
  const assigneeInitials = assigneeInfo ? assigneeInfo.name.substring(0, 2).toUpperCase() : 'UN';
  const assigneeShorthand = assigneeInfo ? assigneeInfo.name : (task.assigneeId || 'Unassigned');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="mb-0 border border-slate-200/60 shadow-sm rounded-lg hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">{task.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col gap-3">
            <p className="text-xs text-slate-500 leading-snug line-clamp-2">{task.description}</p>
            
            <div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] px-2.5 py-0.5">
                Core Feature
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">
                  {assigneeInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 leading-tight">Assigned To:</span>
                <span className="text-xs font-semibold text-slate-800 leading-tight">{assigneeShorthand}</span>
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
                <span className="text-[10px] font-medium uppercase tracking-wider">Now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Created on {new Date(task.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold w-24">Status:</span>
            <Badge>{task.status}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold w-24">Assignee:</span>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px]">{assigneeInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{assigneeShorthand}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-sm font-semibold">Description:</span>
            <div className="bg-slate-50 p-3 rounded-md max-h-[150px] overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
              {task.description}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-4 border-t pt-4">
            <span className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Activity Log
            </span>
            <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2">
              {(!task.comments || task.comments.length === 0) ? (
                <span className="text-xs text-slate-400 italic">No activity recorded yet.</span>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-1 bg-white border border-slate-100 p-2.5 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">{comment.agentId}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
