import { HomePage } from '@/views/_home';
import { ProjectRouteSync } from '@/features/project-management/ui/ProjectRouteSync';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  
  return (
    <>
      <ProjectRouteSync routeProjectId={projectId} />
      <HomePage />
    </>
  );
}
