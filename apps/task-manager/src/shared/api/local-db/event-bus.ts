import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export function notifyDbChange(projectId: string): void {
  emitter.emit(`db:change:${projectId}`);
}

export function subscribeDbChange(
  projectId: string,
  callback: () => void
): () => void {
  emitter.on(`db:change:${projectId}`, callback);
  return () => {
    emitter.off(`db:change:${projectId}`, callback);
  };
}
