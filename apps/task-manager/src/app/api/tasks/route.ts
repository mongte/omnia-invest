import { NextResponse } from 'next/server';
import { getDb, saveDb, withLock, deleteTask } from '@/shared/api/local-db';
import { Task } from '@/entities/task';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  const db = await getDb(projectId);
  return NextResponse.json(db.tasks);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  try {
    const body: Partial<Task> & { assigneeId?: string | null } = await request.json();
    return await withLock(projectId, async () => {
      const db = await getDb(projectId);

      // ID가 없거나 null/undefined인 경우 자동 생성
      if (!body.id) {
        body.id = `task-${Date.now()}`;
      }

      const index = db.tasks.findIndex(t => t.id === body.id);
      if (index >= 0) {
        const existingTask = db.tasks[index];
        // assigneeId: null은 Unassigned(undefined)로 정규화
        const assigneeId =
          body.assigneeId === null || body.assigneeId === ''
            ? undefined
            : body.assigneeId;
        const merged: Task = {
          ...existingTask,
          ...body,
          assigneeId,
          updatedAt: new Date().toISOString(),
        };
        db.tasks[index] = merged;
      } else {
        const task: Task = {
          id: body.id,
          title: body.title ?? '',
          description: body.description ?? '',
          status: body.status ?? 'TODO',
          assigneeId:
            body.assigneeId === null || body.assigneeId === ''
              ? undefined
              : body.assigneeId,
          comments: body.comments ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.tasks.push(task);
      }

      const savedTask = db.tasks.find(t => t.id === body.id)!;
      await saveDb(projectId, db);
      return NextResponse.json(savedTask);
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  }

  try {
    const deletedTask = await deleteTask(projectId, taskId);
    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(deletedTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
