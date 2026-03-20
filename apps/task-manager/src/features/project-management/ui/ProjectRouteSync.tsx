"use client";

import { useEffect } from 'react';
import { useProjectStore } from '@/entities/project/model/store';
import { useRouter, usePathname } from 'next/navigation';

export function ProjectRouteSync({ routeProjectId }: { routeProjectId?: string }) {
  const selectProject = useProjectStore(state => state.selectProject);
  const selectedProjectId = useProjectStore(state => state.selectedProjectId);
  const projects = useProjectStore(state => state.projects);
  const router = useRouter();
  const pathname = usePathname();

  // 1. URL -> Store Sync
  useEffect(() => {
    if (projects.length === 0) return;

    if (routeProjectId) {
      if (selectedProjectId !== routeProjectId && projects.some(p => p.id === routeProjectId)) {
        selectProject(routeProjectId);
      } else if (!projects.some(p => p.id === routeProjectId)) {
        // If route has invalid ID, fallback to first project
        if (selectedProjectId !== projects[0].id) {
          selectProject(projects[0].id);
        }
      }
    } else {
      // If no routeProjectId (e.g. on /), fallback to first project
      if (!selectedProjectId) {
        selectProject(projects[0].id);
      }
    }
  }, [routeProjectId, projects, selectedProjectId, selectProject]);

  // 2. Store -> URL Sync
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const targetPath = `/projects/${selectedProjectId}`;
      if (pathname !== targetPath) {
        // use router.replace to avoid clogging the history stack unnecessarily on auto-select
        router.replace(targetPath);
      }
    }
  }, [selectedProjectId, pathname, router, projects]);

  return null;
}
