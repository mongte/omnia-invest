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
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
}

export type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>()(
  subscribeWithSelector((set, get) => ({
    agents: [],
    isLoading: false,
    error: null,
    
    setAgents: (agents) => set({ agents }),
    
    updateAgentStatus: (agentId, status) => set({
      agents: get().agents.map(a => a.id === agentId ? { ...a, status } : a)
    })
  }))
);
