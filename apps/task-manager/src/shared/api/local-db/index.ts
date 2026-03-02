import fs from 'fs/promises';
import path from 'path';
import { Task } from '@/entities/task/model/types';
import { Agent } from '@/entities/agent/model/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'current_project.json');

export interface DbSchema {
  tasks: Task[];
  agents: Agent[];
}

const DEFAULT_DB: DbSchema = {
  tasks: [
    {
      id: 'task-1',
      title: 'Project Setup & Scaffolding',
      description: 'Initialize Nx workspace, Next.js app, and basic layout.',
      status: 'DONE',
      assigneeId: 'agent-1',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'task-2',
      title: 'Design System Construction',
      description: 'Implement Button, Card, Badge with shadcn/ui and Tailwind.',
      status: 'IN_REVIEW',
      assigneeId: 'agent-1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Local Database Setup',
      description: 'Replace Supabase with local JSON filesystem logic.',
      status: 'IN_PROGRESS',
      assigneeId: 'agent-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Google Sheets Archiving API',
      description: 'Build scripts to archive older project data into Google Sheets.',
      status: 'TODO',
      assigneeId: 'agent-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  agents: [
    {
      id: 'agent-pm',
      name: 'Project Manager',
      role: 'PM',
      status: 'IDLE',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent-fe-1',
      name: 'Frontend Agent 1',
      role: 'Frontend',
      status: 'IDLE',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent-fe-2',
      name: 'Frontend Agent 2',
      role: 'Frontend',
      status: 'IDLE',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent-be-1',
      name: 'Backend Expert',
      role: 'Backend',
      status: 'IDLE',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent-qa',
      name: 'QA Specialist',
      role: 'QA',
      status: 'IDLE',
      lastActiveAt: new Date().toISOString(),
    }
  ],
};

export const getDb = async (): Promise<DbSchema> => {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      return JSON.parse(data) as DbSchema;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        await saveDb(DEFAULT_DB);
        return DEFAULT_DB;
      }
      throw e;
    }
  } catch (error) {
    console.error('Failed to read Local DB:', error);
    return DEFAULT_DB;
  }
};

export const saveDb = async (data: DbSchema): Promise<void> => {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write Local DB:', error);
  }
};
