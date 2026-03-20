import fs from 'fs/promises';
import path from 'path';
import { Task } from '@/entities/task/model/types';
import { Agent } from '@/entities/agent/model/types';

const DB_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DB_DIR, 'projects.json');
const PROJECTS_DATA_DIR = path.join(DB_DIR, 'projects');

export interface Project {
  id: string;
  title: string;
  color: string;
  icon?: string;
}

export interface DbSchema {
  tasks: Task[];
  agents: Agent[];
}



const getProjectDbFile = (projectId: string) =>
  path.join(PROJECTS_DATA_DIR, `${projectId}.json`);

export const getDb = async (projectId: string): Promise<DbSchema> => {
  try {
    await fs.mkdir(PROJECTS_DATA_DIR, { recursive: true });
    const file = getProjectDbFile(projectId);
    try {
      const data = await fs.readFile(file, 'utf-8');
      return JSON.parse(data) as DbSchema;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        // 파일이 없으면 빈 DB로 초기화 (새 프로젝트는 태스크 없이 시작)
        const emptyDb: DbSchema = { tasks: [], agents: [] };
        await saveDb(projectId, emptyDb);
        return emptyDb;
      }
      throw e;
    }
  } catch (error) {
    console.error('Failed to read project DB:', error);
    return { tasks: [], agents: [] };
  }
};

export const saveDb = async (projectId: string, data: DbSchema): Promise<void> => {
  try {
    await fs.mkdir(PROJECTS_DATA_DIR, { recursive: true });
    await fs.writeFile(getProjectDbFile(projectId), JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write project DB:', error);
  }
};

export const deleteProjectDb = async (projectId: string): Promise<void> => {
  try {
    const file = getProjectDbFile(projectId);
    await fs.unlink(file).catch(() => {}); // ignore if not exists
  } catch (error) {
    console.error('Failed to delete project DB file:', error);
  }
};

export const getProjectsList = async (): Promise<Project[]> => {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
      return JSON.parse(data) as Project[];
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        const defaultProjects: Project[] = [
          { id: 'proj-alpha', title: 'Project Alpha', color: 'blue' },
          { id: 'proj-beta', title: 'Beta Service', color: 'orange' },
          { id: 'proj-gamma', title: 'Gamma Tool', color: 'purple' },
        ];
        await saveProjectsList(defaultProjects);
        return defaultProjects;
      }
      throw e;
    }
  } catch (error) {
    console.error('Failed to read Projects DB:', error);
    return [];
  }
};

export const saveProjectsList = async (projects: Project[]): Promise<void> => {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write Projects DB:', error);
  }
};
