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
  fetchAgents: (projectId: string, silent?: boolean) => Promise<void>;
  updateAgentStatus: (agentId: string, status: AgentStatus, projectId: string) => Promise<void>;
}

export type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>()(
  subscribeWithSelector((set, get) => ({
    agents: [],
    isLoading: false,
    error: null,

    setAgents: (agents) => set({ agents }),

    fetchAgents: async (projectId: string, silent = false) => {
      if (!silent) {
        set({ isLoading: true, error: null, agents: [] });
      } else {
        set({ error: null });
      }
      try {
        const res = await fetch(`/api/agents?projectId=${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch agents');
        const data: unknown = await res.json();
        const agents = Array.isArray(data) ? data : [];
        set({ agents, isLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message, isLoading: false });
      }
    },

    updateAgentStatus: async (agentId, status, projectId) => {
      try {
        set({
          agents: get().agents.map(a => (a.id === agentId ? { ...a, status } : a)),
        });

        const agentToUpdate = get().agents.find(a => a.id === agentId);
        if (!agentToUpdate) throw new Error('Agent not found');

        const res = await fetch(`/api/agents?projectId=${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...agentToUpdate, status }),
        });

        if (!res.ok) {
          await get().fetchAgents(projectId);
          throw new Error('Failed to update agent');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ error: message });
      }
    },
  }))
);
