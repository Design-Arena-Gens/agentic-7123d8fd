'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type StepStatus = 'idle' | 'running' | 'completed' | 'error';

type WorkflowStep = {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
};

type JobResponse = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  steps: WorkflowStep[];
  error?: string;
  result?: {
    script: string;
    metadata: {
      title: string;
      keywords: string[];
      description: string;
      scheduledPublishTime?: string;
      youtubeVideoId?: string;
    };
  };
};

const EMPTY_STEPS: WorkflowStep[] = [
  { id: 'idea', label: 'Generate Script & Prompts', status: 'idle' },
  { id: 'voiceover', label: 'Voiceover Synthesis', status: 'idle' },
  { id: 'imagery', label: 'Image Generation', status: 'idle' },
  { id: 'video', label: 'Video Assembly', status: 'idle' },
  { id: 'thumbnail', label: 'Thumbnail Design', status: 'idle' },
  { id: 'youtube', label: 'YouTube Scheduling', status: 'idle' }
];

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetRowIndex, setSheetRowIndex] = useState(1);
  const [storyScript, setStoryScript] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const mergedSteps = useMemo(() => {
    const base = EMPTY_STEPS.map((step) => ({ ...step }));
    if (!job?.steps) return base;
    const stepMap = new Map(job.steps.map((s) => [s.id, s] as const));
    return base.map((step) => stepMap.get(step.id) ?? step);
  }, [job]);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/workflow?id=${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch job');
        const data: JobResponse = await res.json();
        if (!active) return;
        setJob(data);
        if (data.status === 'completed' || data.status === 'error') {
          active = false;
          if (data.status === 'completed') {
            void hydrateAssets(jobId);
          }
          return;
        }
        setTimeout(poll, 3000);
      } catch (error) {
        console.error(error);
        if (active) setTimeout(poll, 4000);
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [jobId]);

  const hydrateAssets = async (id: string) => {
    try {
      const [videoRes, audioRes, thumbRes] = await Promise.all([
        fetch(`/api/workflow/download?id=${id}&artifact=video`),
        fetch(`/api/workflow/download?id=${id}&artifact=audio`),
        fetch(`/api/workflow/download?id=${id}&artifact=thumbnail`)
      ]);
      if (videoRes.ok) {
        const blob = await videoRes.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
      if (audioRes.ok) {
        const blob = await audioRes.blob();
        setAudioUrl(URL.createObjectURL(blob));
      }
      if (thumbRes.ok) {
        const blob = await thumbRes.blob();
        setThumbnailUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setJob(null);
    setVideoUrl(null);
    setAudioUrl(null);
    setThumbnailUrl(null);
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sheetUrl,
          sheetRowIndex,
          storyScript,
          customTitle,
          keywords,
          publishAt
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: { id: string } = await res.json();
      setJobId(data.id);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section>
        <h1 style={{ fontSize: '34px', marginTop: 0, marginBottom: '18px' }}>
          Autonomous AI YouTube Workflow
        </h1>
        <p style={{ margin: '0 0 32px', maxWidth: 720, color: 'rgba(217,226,255,0.7)' }}>
          Provide a Google Sheet with content ideas or drop in your own script. The
          orchestrator coordinates script generation, voiceover synthesis, animated imagery,
          video assembly, thumbnail design, and YouTube scheduling end-to-end.
        </p>
        <form onSubmit={onSubmit} className="form-grid">
          <div>
            <label htmlFor="sheetUrl">Published Google Sheet CSV/Link</label>
            <input
              id="sheetUrl"
              placeholder="https://docs.google.com/spreadsheets/..."
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rowIndex">Idea Row Index (1-based)</label>
            <input
              id="rowIndex"
              type="number"
              min={1}
              value={sheetRowIndex}
              onChange={(event) => setSheetRowIndex(Number(event.target.value))}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="storyScript">Override Script (optional)</label>
            <textarea
              id="storyScript"
              placeholder="Paste your final narration script here if you already have one."
              value={storyScript}
              onChange={(event) => setStoryScript(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="customTitle">Override Video Title (optional)</label>
            <input
              id="customTitle"
              placeholder="Custom title"
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="keywords">Override Keywords (comma separated)</label>
            <input
              id="keywords"
              placeholder="ai, automation, youtube"
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="publishAt">Schedule Publish ISO Date (UTC)</label>
            <input
              id="publishAt"
              placeholder="2024-05-31T18:00:00Z"
              value={publishAt}
              onChange={(event) => setPublishAt(event.target.value)}
            />
          </div>
          <div style={{ alignSelf: 'end', display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Launching Workflow…' : 'Run Full Workflow'}
            </button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: '36px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Agent Progress</h2>
        <div className="status-grid">
          {mergedSteps.map((step) => (
            <div key={step.id} className="status-card">
              <span className={`badge ${step.status}`}>
                {step.status === 'idle' && 'Idle'}
                {step.status === 'running' && 'Running'}
                {step.status === 'completed' && 'Completed'}
                {step.status === 'error' && 'Error'}
              </span>
              <h3>{step.label}</h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>{step.detail}</p>
            </div>
          ))}
        </div>

        {job?.error ? (
          <div style={{ marginTop: '24px', color: '#ff8080' }}>Workflow failed: {job.error}</div>
        ) : null}

        {job?.status === 'completed' && job.result ? (
          <div className="results">
            <div>
              <h3 style={{ marginBottom: '12px' }}>Final Script</h3>
              <pre>{job.result.script}</pre>
            </div>
            {videoUrl ? (
              <div>
                <h3 style={{ marginBottom: '12px' }}>Video Preview</h3>
                <video className="video-preview" controls src={videoUrl} />
              </div>
            ) : null}
            {audioUrl ? (
              <div>
                <h3 style={{ marginBottom: '12px' }}>Voiceover Audio</h3>
                <audio controls src={audioUrl} />
              </div>
            ) : null}
            {thumbnailUrl ? (
              <div>
                <h3 style={{ marginBottom: '12px' }}>Thumbnail</h3>
                <img className="thumbnail-preview" src={thumbnailUrl} alt="Generated thumbnail" />
              </div>
            ) : null}
            <div>
              <h3 style={{ marginBottom: '12px' }}>YouTube Metadata</h3>
              <pre>{JSON.stringify(job.result.metadata, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
