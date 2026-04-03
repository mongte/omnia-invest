import { NextResponse } from 'next/server';
import { subscribeDbChange } from '@/shared/api/local-db/event-bus';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: connected\n\n`));

      const unsubscribe = projectId
        ? subscribeDbChange(projectId, () => {
            try {
              controller.enqueue(encoder.encode(`data: update\n\n`));
            } catch {
              // Stream closed
            }
          })
        : () => {};

      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`));
        } catch {
          clearInterval(timer);
          unsubscribe();
        }
      }, 30000);

      return () => {
        clearInterval(timer);
        unsubscribe();
      };
    },
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
