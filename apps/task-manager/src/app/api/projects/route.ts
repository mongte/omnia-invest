import { NextResponse } from 'next/server';
import { getProjectsList, saveProjectsList, saveDb, Project } from '@/shared/api/local-db';

export async function GET() {
  const projects = await getProjectsList();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const projects = await getProjectsList();
    
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: data.title || 'New Project',
      color: data.color || 'blue',
      // icon will be generated randomly or sent from FE
      icon: data.icon || 'Folder'
    };
    
    projects.push(newProject);
    await saveProjectsList(projects);

    // 새 프로젝트의 빈 DB 파일을 즉시 생성 (tasks: [], agents: [])
    await saveDb(newProject.id, { tasks: [], agents: [] });

    return NextResponse.json(newProject);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
