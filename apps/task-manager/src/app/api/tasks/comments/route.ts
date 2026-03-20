import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/shared/api/local-db';
import { TaskComment } from '@/entities/task';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const { taskId, agentId, content } = await request.json();
    
    if (!taskId || !agentId || !content) {
      return NextResponse.json({ error: 'taskId, agentId, and content are required' }, { status: 400 });
    }

    const db = await getDb(projectId);
    const index = db.tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const newComment: TaskComment = {
      id: `comment-${Date.now()}`,
      agentId,
      content,
      createdAt: new Date().toISOString()
    };

    if (!db.tasks[index].comments) {
      db.tasks[index].comments = [];
    }
    
    db.tasks[index].comments.push(newComment);
    db.tasks[index].updatedAt = new Date().toISOString();

    await saveDb(projectId, db);
    return NextResponse.json(newComment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
