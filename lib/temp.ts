import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

export const createWorkspace = (jobId: string) => {
  const base = mkdtempSync(path.join(tmpdir(), `agentic-${jobId}-`));
  return {
    path: base,
    cleanup: () => {
      try {
        rmSync(base, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to cleanup workspace', error);
      }
    }
  };
};
