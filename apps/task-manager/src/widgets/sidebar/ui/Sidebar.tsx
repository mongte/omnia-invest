import Link from 'next/link';
import { LayoutDashboard, FolderKanban } from 'lucide-react';

export const Sidebar = () => {
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
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors hover:text-white">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Dashboard
          </Link>
          <div className="px-3 py-2 text-sm flex items-center gap-3 font-medium text-white mt-4">
            <FolderKanban className="w-4 h-4 text-slate-400" />
            Projects
          </div>
          <div className="pl-9 space-y-1">
            <Link href="/" className="block px-3 py-2 text-sm rounded-md bg-slate-800 text-white font-medium">
              Project Alpha
            </Link>
            <Link href="/beta" className="block px-3 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors">
              Beta Service
            </Link>
            <Link href="/gamma" className="block px-3 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors">
              Gamma Tool
            </Link>
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
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
        </div>
      </div>
    </aside>
  );
};
