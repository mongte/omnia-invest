"use client";

import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/entities/project/model/store';
import { useTaskStore } from '@/entities/task/model/store';
import { useAgentStore } from '@/entities/agent/model/store';
import { useRouter } from 'next/navigation';

export function ProjectRouteSync({ routeProjectId }: { routeProjectId?: string }) {
  const selectProject = useProjectStore(state => state.selectProject);
  const projects = useProjectStore(state => state.projects);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const fetchAgents = useAgentStore(state => state.fetchAgents);
  const router = useRouter();

  // 마지막으로 fetch한 projectId를 ref로 추적하여 중복 fetch 방지
  const lastFetchedProjectId = useRef<string | null>(null);

  // URL -> Store Sync + 데이터 fetch를 하나의 effect에서 처리
  // routeProjectId를 직접 사용하여 selectedProjectId stale closure 문제 방지
  useEffect(() => {
    if (projects.length === 0) return;

    if (routeProjectId) {
      if (projects.some(p => p.id === routeProjectId)) {
        // Store 동기화: URL의 projectId로 선택 상태 업데이트
        selectProject(routeProjectId);
        // routeProjectId가 변경된 경우에만 fetch 실행 (불필요한 중복 호출 방지)
        if (lastFetchedProjectId.current !== routeProjectId) {
          lastFetchedProjectId.current = routeProjectId;
          fetchTasks(routeProjectId);
          fetchAgents(routeProjectId);
        }
      } else {
        // 유효하지 않은 routeProjectId면 첫 번째 프로젝트로 fallback
        const fallbackId = projects[0].id;
        router.replace(`/projects/${fallbackId}`);
      }
    } else {
      // routeProjectId 없으면 첫 번째 프로젝트로 fallback
      const fallbackId = projects[0].id;
      router.replace(`/projects/${fallbackId}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeProjectId, projects]);

  return null;
}
