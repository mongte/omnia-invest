import { EventEmitter } from 'events';

const GLOBAL_KEY = Symbol.for('task-manager-event-bus');

function getEmitter(): EventEmitter {
  const g = globalThis as Record<symbol, EventEmitter>;
  if (!g[GLOBAL_KEY]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    g[GLOBAL_KEY] = emitter;
  }
  return g[GLOBAL_KEY];
}

export function notifyDbChange(projectId: string): void {
  getEmitter().emit(`db:change:${projectId}`);
}

export function subscribeDbChange(
  projectId: string,
  callback: () => void
): () => void {
  const emitter = getEmitter();
  emitter.on(`db:change:${projectId}`, callback);
  return () => {
    emitter.off(`db:change:${projectId}`, callback);
  };
}
