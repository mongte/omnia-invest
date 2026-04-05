import { NextResponse } from 'next/server';
import { getDb, saveDb, withLock } from '@/shared/api/local-db';
import { TaskComment } from '@/entities/task';

interface CommentRequestBody {
  agentId: string;
  content: string;
}

export async function POST(request: Request) {
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
    const body: CommentRequestBody = await request.json();
    const { agentId, content } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }
    if (content === '' || !content) {
      return NextResponse.json({ error: 'content must not be empty' }, { status: 400 });
    }

    return await withLock(projectId, async () => {
      const db = await getDb(projectId);
      const index = db.tasks.findIndex(t => t.id === taskId);

      if (index === -1) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const newComment: TaskComment = {
        id: `comment-${Date.now()}`,
        agentId,
        content,
        createdAt: new Date().toISOString(),
      };

      if (!db.tasks[index].comments) {
        db.tasks[index].comments = [];
      }

      db.tasks[index].comments.push(newComment);
      db.tasks[index].updatedAt = new Date().toISOString();

      await saveDb(projectId, db);
      return NextResponse.json(newComment, { status: 201 });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
