import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/shared/api/local-db';
import { Agent } from '@/entities/agent';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.agents);
}

export async function POST(request: Request) {
  try {
    const agent: Agent = await request.json();
    const db = await getDb();
    
    const index = db.agents.findIndex(a => a.id === agent.id);
    if (index >= 0) {
      db.agents[index] = agent;
    } else {
      db.agents.push(agent);
    }
    
    await saveDb(db);
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process agent' }, { status: 500 });
  }
}
