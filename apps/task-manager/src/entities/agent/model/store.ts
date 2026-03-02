import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Agent, AgentStatus } from './types';

export interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
}

export interface AgentActions {
  setAgents: (agents: Agent[]) => void;
  fetchAgents: () => Promise<void>;
  updateAgentStatus: (agentId: string, status: AgentStatus) => Promise<void>;
}

export type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>()(
  subscribeWithSelector((set, get) => ({
    agents: [],
    isLoading: false,
    error: null,
    
    setAgents: (agents) => set({ agents }),
    
    fetchAgents: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        const agents = await res.json();
        set({ agents: agents || [], isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    updateAgentStatus: async (agentId, status) => {
      try {
        set({
          agents: get().agents.map(a => a.id === agentId ? { ...a, status } : a)
        });

        const agentToUpdate = get().agents.find(a => a.id === agentId);
        if (!agentToUpdate) throw new Error('Agent not found');

        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...agentToUpdate, status }),
        });

        if (!res.ok) {
          await get().fetchAgents();
          throw new Error('Failed to update agent');
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    }
  }))
);
