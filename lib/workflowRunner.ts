import { fetchIdeas } from './sheets';
import { generateScriptBundle } from './scriptGenerator';
import { synthesizeVoiceover } from './voiceover';
import { generateImageSet } from './imageGenerator';
import { assembleVideo } from './videoAssembler';
import { buildThumbnail } from './thumbnail';
import { scheduleToYouTube } from './youtubeScheduler';
import { createWorkspace } from './temp';
import { setJobResult, setJobStatus, setStep } from './jobStore';
import { WorkflowPayload } from '../types/workflow';

export const launchWorkflow = async (jobId: string, payload: WorkflowPayload) => {
  const workspace = createWorkspace(jobId);
  let activeStep: Parameters<typeof setStep>[1] | null = null;
  try {
    setJobStatus(jobId, 'running');

    activeStep = 'idea';
    setStep(jobId, 'idea', 'running', 'Fetching ideas and building script');
    const ideas = await fetchIdeas(payload.sheetUrl);
    const indexFromPayload = (payload.sheetRowIndex ?? 1) - 1;
    const safeIndex = Math.min(Math.max(indexFromPayload, 0), Math.max(ideas.length - 1, 0));
    const idea = ideas[safeIndex];
    const scriptBundle = generateScriptBundle(idea, {
      script: payload.storyScript,
      title: payload.customTitle,
      keywords: payload.keywords
    });
    const wordCount = scriptBundle.script.split(/\s+/).filter(Boolean).length;
    setStep(jobId, 'idea', 'completed', `Script ready (${wordCount} words)`);

    activeStep = 'voiceover';
    setStep(jobId, 'voiceover', 'running', 'Synthesizing narration with Google TTS');
    const voiceoverPath = await synthesizeVoiceover(scriptBundle.script, workspace.path);
    setStep(jobId, 'voiceover', 'completed', 'Voiceover rendered');

    activeStep = 'imagery';
    setStep(jobId, 'imagery', 'running', 'Fetching cinematic imagery');
    const imagePaths = await generateImageSet(scriptBundle.prompts, workspace.path);
    setStep(jobId, 'imagery', 'completed', `${imagePaths.length} frames ready`);

    activeStep = 'video';
    setStep(jobId, 'video', 'running', 'Assembling slideshow and mixing audio');
    const { videoPath, audioMixPath, duration } = await assembleVideo({
      audioPath: voiceoverPath,
      imagePaths,
      workspace: workspace.path
    });
    setStep(jobId, 'video', 'completed', `Final cut synced (${duration.toFixed(1)}s)`);

    activeStep = 'thumbnail';
    setStep(jobId, 'thumbnail', 'running', 'Designing thumbnail');
    const thumbnailPath = await buildThumbnail(imagePaths[0], scriptBundle.metadata.title, scriptBundle.metadata.keywords, workspace.path);
    setStep(jobId, 'thumbnail', 'completed', 'Thumbnail exported');

    activeStep = 'youtube';
    setStep(jobId, 'youtube', 'running', 'Uploading to YouTube (if creds present)');
    const youtubeResult = await scheduleToYouTube({
      videoPath,
      thumbnailPath,
      title: scriptBundle.metadata.title,
      description: scriptBundle.metadata.description,
      keywords: scriptBundle.metadata.keywords,
      publishAt: payload.publishAt
    });

    if (youtubeResult.success) {
      setStep(jobId, 'youtube', 'completed', youtubeResult.videoId ? `Scheduled ${youtubeResult.videoId}` : 'Upload completed');
    } else {
      setStep(jobId, 'youtube', 'completed', youtubeResult.reason);
    }

    setJobResult(jobId, {
      script: scriptBundle.script,
      metadata: {
        title: scriptBundle.metadata.title,
        keywords: scriptBundle.metadata.keywords,
        description: scriptBundle.metadata.description,
        scheduledPublishTime: payload.publishAt,
        youtubeVideoId: youtubeResult.success ? youtubeResult.videoId : undefined,
        youtubeVideoUrl: youtubeResult.success ? youtubeResult.videoUrl : undefined
      },
      artifacts: {
        audioPath: audioMixPath,
        videoPath,
        thumbnailPath
      }
    });

    setJobStatus(jobId, 'completed');
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Workflow failed';
    if (activeStep) {
      setStep(jobId, activeStep, 'error', message);
    }
    setJobStatus(jobId, 'error', message);
  }
};
