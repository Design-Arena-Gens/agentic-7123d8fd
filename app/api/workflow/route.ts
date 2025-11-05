import { NextResponse } from 'next/server';
import { createJob, getJob } from '../../../lib/jobStore';
import { launchWorkflow } from '../../../lib/workflowRunner';
import { WorkflowPayload } from '../../../types/workflow';

export async function POST(request: Request) {
  const payload = (await request.json()) as WorkflowPayload;
  const job = createJob(payload);
  void launchWorkflow(job.id, payload).catch((error) => {
    console.error('Workflow crashed', error);
  });
  return NextResponse.json({ id: job.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(job);
}
