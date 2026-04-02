"use client";

import { useEffect } from 'react';
import { useProjectStore } from '@/entities/project/model/store';
import { useRouter } from 'next/navigation';

export function ProjectRouteSync({ routeProjectId }: { routeProjectId?: string }) {
  const selectProject = useProjectStore(state => state.selectProject);
  const selectedProjectId = useProjectStore(state => state.selectedProjectId);
  const projects = useProjectStore(state => state.projects);
  const router = useRouter();

  // 1. URL -> Store Sync
  useEffect(() => {
    if (projects.length === 0) return;

    if (routeProjectId) {
      if (projects.some(p => p.id === routeProjectId)) {
        if (selectedProjectId !== routeProjectId) {
          selectProject(routeProjectId);
        }
      } else {
        // If route has invalid ID, fallback to selected or first
        const fallbackId = selectedProjectId && projects.some(p => p.id === selectedProjectId)
          ? selectedProjectId
          : projects[0].id;
        router.replace(`/projects/${fallbackId}`);
      }
    } else {
      // If no routeProjectId (e.g. on /), fallback
      const fallbackId = selectedProjectId && projects.some(p => p.id === selectedProjectId)
        ? selectedProjectId
        : projects[0].id;
      router.replace(`/projects/${fallbackId}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeProjectId, projects]);

  return null;
}
