"use client";

import Link from 'next/link';
import { LayoutDashboard, FolderKanban, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/entities/project/model/store';
import { useEffect, Component, ReactNode } from 'react';

// Error Boundary definition
class ProjectErrorBoundary extends Component<{children: ReactNode, fallback: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode, fallback: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const ProjectItem = ({ p, isSelected, deleteProject }: { p: any, isSelected: boolean, deleteProject: (id: string) => void }) => {
  // Purposefully throw if the project format is totally broken, so ErrorBoundary catches it
  if (!p || typeof p !== 'object' || !p.id || !p.title) {
    throw new Error("Invalid project data");
  }

  return (
    <Link
      href={`/projects/${p.id}`}
      className={`group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors w-full cursor-pointer ${
        isSelected
          ? 'bg-slate-700 text-white'
          : 'hover:bg-slate-800 text-slate-300 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            COLOR_MAP[p.color] ?? 'bg-slate-400'
          }`}
        />
        <span className="truncate">{p.title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteProject(p.id);
        }}
        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 text-slate-500 transition-all focus:outline-none"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </Link>
  );
};


const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  yellow: 'bg-yellow-500',
};

export const Sidebar = () => {
  const { projects, selectedProjectId, isLoading, fetchProjects, deleteProject, selectProject } =
    useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-md w-8 h-8 flex items-center justify-center font-bold text-white shadow-sm">
            A
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Antigravity AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors hover:text-white"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Dashboard
          </Link>

          <div className="px-3 py-2 text-sm flex items-center justify-between font-medium text-white mt-4">
            <div className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4 text-slate-400" />
              Projects
            </div>
          </div>

          <div className="pl-4 space-y-1">
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-slate-500">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">No projects found.</div>
            ) : (
              projects.map((p, index) => {
                const isSelected = p && p.id === selectedProjectId;
                const safeKey = (p && p.id) ? p.id : `invalid-key-${index}`;
                return (
                  <ProjectErrorBoundary
                    key={safeKey}
                    fallback={
                      <div className="px-3 py-2 text-sm text-red-300 bg-red-900/30 rounded-md border border-red-800/50 flex items-center justify-between">
                        <span className="truncate">Corrupted Project Data</span>
                        <Trash2 
                          className="w-3.5 h-3.5 text-red-400 cursor-pointer hover:text-red-300" 
                          onClick={() => { if(p?.id) deleteProject(p.id); }} 
                        />
                      </div>
                    }
                  >
                    <ProjectItem p={p} isSelected={isSelected} deleteProject={deleteProject} />
                  </ProjectErrorBoundary>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* Footer / Status */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between border border-slate-700">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">MCP Status:</span>
            <span className="text-sm font-medium text-emerald-400">Connected (Local)</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </div>
      </div>
    </aside>
  );
};
