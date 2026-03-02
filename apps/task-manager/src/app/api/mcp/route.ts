import { NextResponse } from 'next/server';

/**
 * MCP Edge Communication Route
 * This endpoint is designed for sub-agents (e.g. Serena, oh-my-ag) to 
 * push logs, status updates, or query tasks via MCP protocol.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Example: { type: 'agent_status_update', payload: { agentId: 'agent-1', status: 'WORKING' } }
    console.log('[MCP Route] Received Event: ', payload);

    return NextResponse.json({ success: true, message: 'MCP event received' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid Request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    mcp_version: '1.0.0',
    available_methods: ['POST'] 
  });
}
