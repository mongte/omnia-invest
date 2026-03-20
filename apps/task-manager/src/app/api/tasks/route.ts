import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/shared/api/local-db';
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
    const db = await getDb(projectId);

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

    await saveDb(projectId, db);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}
