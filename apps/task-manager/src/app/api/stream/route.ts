import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    start(controller) {
      const dbPath = path.join(process.cwd(), 'data', 'current_project.json');
      
      const notify = () => {
        try {
          controller.enqueue(encoder.encode(`data: update\n\n`));
        } catch (e) {
          // ignore
        }
      };

      // Initial ping to ensure connection immediately
      controller.enqueue(encoder.encode(`data: connected\n\n`));

      let watcher: fs.FSWatcher | null = null;
      try {
        if (fs.existsSync(dbPath)) {
          watcher = fs.watch(dbPath, (eventType) => {
            if (eventType === 'change') {
              notify();
            }
          });
        }
      } catch (e) {
         console.error("Failed to watch local DB file:", e);
      }

      // Keep connection alive
      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`)); // Spec: Comment keeps alive
        } catch {
          clearInterval(timer);
          if (watcher) watcher.close();
        }
      }, 30000);

      // Cleanup when stream is canceled
      return () => {
        clearInterval(timer);
        if (watcher) watcher.close();
      };
    }
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
