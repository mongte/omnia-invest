export type AgentStatus = 'IDLE' | 'WORKING' | 'OFFLINE' | 'ERROR';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTaskId?: string;
  lastActiveAt: string;
}
