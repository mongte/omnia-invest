import { NextResponse } from 'next/server';
import { getDb, saveDb, withLock } from '@/shared/api/local-db';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    return await withLock(projectId, async () => {
      const db = await getDb(projectId);

      db.tasks = db.tasks.filter(t => t.status !== 'DONE');

      await saveDb(projectId, db);
      return NextResponse.json({ success: true });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear tasks' }, { status: 500 });
  }
}
