import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/shared/api/local-db';
import { Task } from '@/entities/task';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.tasks);
}

export async function POST(request: Request) {
  try {
    const task: Task = await request.json();
    const db = await getDb();
    
    // Check if updating or creating
    const index = db.tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      db.tasks[index] = task;
    } else {
      db.tasks.push(task);
    }
    
    await saveDb(db);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}
