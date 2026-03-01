import { TaskDetailsPage } from '@/views/task-details';

export default function Page({ params }: { params: { id: string } }) {
  return <TaskDetailsPage taskId={params.id} />;
}
