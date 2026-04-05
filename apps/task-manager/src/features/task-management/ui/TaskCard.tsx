'use client';

import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/entities/task';
import { useTaskStore } from '@/entities/task';
import { useProjectStore } from '@/entities/project/model/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { MessageSquare, Calendar, Edit2, Users, Trash2, Loader2, Send } from 'lucide-react';
import { formatKSTShort, formatKSTFull, formatKSTTime } from '@/shared/lib/date-utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/shared/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/shared/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { useAgentStore } from '@/entities/agent';

const UNASSIGNED_VALUE = '__unassigned__';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard = ({ task, index }: TaskCardProps) => {
  const agents = useAgentStore(state => state.agents);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const updateTaskAssignee = useTaskStore(state => state.updateTaskAssignee);
  const addComment = useTaskStore(state => state.addComment);
  const selectedProjectId = useProjectStore(state => state.selectedProjectId);

  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const assigneeInfo = agents.find(a => a.id === task.assigneeId);
  const assigneeName = assigneeInfo?.name ?? assigneeInfo?.id;
  const assigneeInitials = assigneeName ? assigneeName.substring(0, 2).toUpperCase() : 'UN';
  const assigneeShorthand = assigneeName ?? task.assigneeId ?? 'Unassigned';

  const handleDelete = async () => {
    if (!selectedProjectId || !task.id) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id, selectedProjectId);
      setDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssigneeChange = async (value: string) => {
    if (!selectedProjectId) return;
    const newAssigneeId = value === UNASSIGNED_VALUE ? undefined : value;
    await updateTaskAssignee(task.id, newAssigneeId, selectedProjectId);
  };

  const handleCommentSubmit = async () => {
    if (!selectedProjectId || !commentAuthor || !commentContent.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addComment(task.id, commentAuthor, commentContent.trim(), selectedProjectId);
      setCommentAuthor('');
      setCommentContent('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isCommentValid = commentAuthor.length > 0 && commentContent.trim().length > 0;
  const selectValue = task.assigneeId ?? UNASSIGNED_VALUE;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={`transition-shadow ${snapshot.isDragging ? 'opacity-90' : ''}`}
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Card
                className={`mb-0 border border-slate-200/60 rounded-lg cursor-pointer transition-all ${
                  snapshot.isDragging
                    ? 'shadow-2xl ring-2 ring-blue-400 scale-[1.02] bg-white'
                    : 'shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
                onClick={(e) => {
                  if (snapshot.isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
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
                      <span className="text-[10px] font-medium uppercase tracking-wider">{formatKSTShort(task.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{task.title}</DialogTitle>
                <DialogDescription>
                  Created on {formatKSTFull(task.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold w-24">Status:</span>
                  <Badge>{task.status}</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-sm font-semibold w-24 pt-2">Assignee:</span>
                  <div className="flex-1">
                    <Select value={selectValue} onValueChange={handleAssigneeChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="담당자 선택">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-[9px] bg-orange-100 text-orange-700">
                                {assigneeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assigneeShorthand}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-[9px] bg-slate-100 text-slate-500">
                                --
                              </AvatarFallback>
                            </Avatar>
                            <span>Unassigned</span>
                          </div>
                        </SelectItem>
                        {agents.map((agent) => {
                          const agentDisplayName = agent.name ?? agent.id;
                          const agentInitials = agentDisplayName.substring(0, 2).toUpperCase();
                          return (
                            <SelectItem key={agent.id} value={agent.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-[9px] bg-orange-100 text-orange-700">
                                    {agentInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{agentDisplayName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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
                  <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-2">
                    {(!task.comments || task.comments.length === 0) ? (
                      <span className="text-xs text-slate-400 italic">No activity recorded yet.</span>
                    ) : (
                      task.comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col gap-1 bg-white border border-slate-100 p-2.5 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">{comment.agentId}</span>
                            <span className="text-[10px] text-slate-400">
                              {formatKSTTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 댓글 작성 폼 */}
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">새 댓글 작성</span>
                    <Select value={commentAuthor} onValueChange={setCommentAuthor}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="작성자 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => {
                          const agentDisplayName = agent.name ?? agent.id;
                          const agentInitials = agentDisplayName.substring(0, 2).toUpperCase();
                          return (
                            <SelectItem key={agent.id} value={agent.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="text-[8px] bg-orange-100 text-orange-700">
                                    {agentInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{agentDisplayName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="댓글 내용을 입력하세요..."
                      className="text-xs min-h-[72px] resize-none"
                      disabled={isSubmittingComment}
                    />
                    <button
                      type="button"
                      onClick={handleCommentSubmit}
                      disabled={!isCommentValid || isSubmittingComment}
                      aria-label="댓글 작성"
                      className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md text-xs font-medium transition-colors bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {isSubmittingComment ? '작성 중...' : '작성'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t">
                  <span className="text-xs text-slate-400">Danger Zone</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        aria-label="태스크 삭제"
                        className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 rounded px-2 py-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>태스크 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          정말 이 태스크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex items-center gap-2"
                        >
                          {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <DialogClose className="sr-only" />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Draggable>
  );
};
