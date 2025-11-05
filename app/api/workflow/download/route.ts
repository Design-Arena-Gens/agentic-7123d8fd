import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { getJob } from '../../../../lib/jobStore';

const MIME_MAP = {
  video: 'video/mp4',
  audio: 'audio/mpeg',
  thumbnail: 'image/jpeg'
} as const;

type ArtifactKey = keyof typeof MIME_MAP;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');
  const artifact = searchParams.get('artifact') as ArtifactKey | null;

  if (!jobId || !artifact) {
    return NextResponse.json({ error: 'Missing id or artifact' }, { status: 400 });
  }

  const job = getJob(jobId);
  const artifacts = job?.result?.artifacts;
  if (!artifacts) {
    return NextResponse.json({ error: 'Job has no artifacts' }, { status: 404 });
  }

  const key = `${artifact}Path` as keyof typeof artifacts;
  const filePath = artifacts[key] as string | undefined;
  if (!filePath) {
    return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
  }

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch {
    return NextResponse.json({ error: 'File missing' }, { status: 404 });
  }

  const stat = await fs.promises.stat(filePath);
  const stream = fs.createReadStream(filePath);
  const body = Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;
  return new Response(body, {
    headers: {
      'Content-Length': stat.size.toString(),
      'Content-Type': MIME_MAP[artifact],
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
    }
  });
}
