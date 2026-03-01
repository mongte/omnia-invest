import '@/app/global.css';
import { Sidebar } from '@/widgets/sidebar';

export const metadata = {
  title: 'Antigravity AI Dashboard',
  description: 'AI Agent Task Manager within an Nx monorepo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
