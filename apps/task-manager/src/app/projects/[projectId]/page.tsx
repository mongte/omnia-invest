import { HomePage } from '@/views/_home';
import { ProjectRouteSync } from '@/features/project-management/ui/ProjectRouteSync';

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return (
    <>
      <ProjectRouteSync routeProjectId={params.projectId} />
      <HomePage />
    </>
  );
}
