import { NextResponse } from 'next/server';
import { getProjectsList, saveProjectsList, archiveProjectDb } from '@/shared/api/local-db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const projects = await getProjectsList();
    const updatedProjects = projects.filter(p => p.id !== projectId);

    if (projects.length === updatedProjects.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await saveProjectsList(updatedProjects);
    // Archive the project's task/agent data file to projects-delete/ instead of permanently deleting
    await archiveProjectDb(projectId);

    return NextResponse.json({ success: true, deletedId: projectId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
