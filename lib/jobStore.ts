import { randomUUID } from 'crypto';
import { WorkflowJob, WorkflowPayload, WorkflowStepState } from '../types/workflow';

const jobs = new Map<string, WorkflowJob>();

const BASE_STEPS: WorkflowStepState[] = [
  { id: 'idea', label: 'Generate Script & Prompts', status: 'idle' },
  { id: 'voiceover', label: 'Voiceover Synthesis', status: 'idle' },
  { id: 'imagery', label: 'Image Generation', status: 'idle' },
  { id: 'video', label: 'Video Assembly', status: 'idle' },
  { id: 'thumbnail', label: 'Thumbnail Design', status: 'idle' },
  { id: 'youtube', label: 'YouTube Scheduling', status: 'idle' }
];

export const createJob = (payload: WorkflowPayload) => {
  const id = randomUUID();
  const now = Date.now();
  const job: WorkflowJob = {
    id,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    steps: BASE_STEPS.map((step) => ({ ...step }))
  };
  jobs.set(id, job);
  return job;
};

export const getJob = (id: string) => jobs.get(id);

export const updateJob = (id: string, updater: (job: WorkflowJob) => void) => {
  const job = jobs.get(id);
  if (!job) {
    throw new Error(`Job ${id} not found`);
  }
  updater(job);
  job.updatedAt = Date.now();
  jobs.set(id, job);
  return job;
};

export const setStep = (
  id: string,
  stepId: WorkflowStepState['id'],
  status: WorkflowStepState['status'],
  detail?: string
) => {
  return updateJob(id, (job) => {
    const step = job.steps.find((s) => s.id === stepId);
    if (!step) return;
    step.status = status;
    step.detail = detail;
  });
};

export const setJobStatus = (id: string, status: WorkflowJob['status'], error?: string) => {
  return updateJob(id, (job) => {
    job.status = status;
    job.error = error;
  });
};

export const setJobResult = (id: string, result: WorkflowJob['result']) => {
  return updateJob(id, (job) => {
    job.result = result;
  });
};

export const listJobs = () => Array.from(jobs.values());
