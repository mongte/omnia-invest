import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/shared/api/local-db';
import { Agent } from '@/entities/agent';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  const db = await getDb(projectId);
  return NextResponse.json(db.agents);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  try {
    const agent: Agent = await request.json();
    const db = await getDb(projectId);

    const index = db.agents.findIndex(a => a.id === agent.id);
    if (index >= 0) {
      db.agents[index] = agent;
    } else {
      db.agents.push(agent);
    }

    await saveDb(projectId, db);
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process agent' }, { status: 500 });
  }
}
