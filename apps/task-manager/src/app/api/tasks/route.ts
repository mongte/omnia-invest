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
    const task: Task = await request.json();
    return await withLock(projectId, async () => {
      const db = await getDb(projectId);

      // ID가 없거나 null/undefined인 경우 자동 생성
      if (!task.id) {
        task.id = `task-${Date.now()}`;
      }

      const index = db.tasks.findIndex(t => t.id === task.id);
      if (index >= 0) {
        const existingTask = db.tasks[index];
        db.tasks[index] = {
          ...existingTask,
          ...task,
          updatedAt: new Date().toISOString(),
        };
      } else {
        db.tasks.push({
          ...task,
          comments: task.comments || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const savedTask = db.tasks.find(t => t.id === task.id)!;
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
