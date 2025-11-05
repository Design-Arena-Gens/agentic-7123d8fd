export type StepIdentifier =
  | 'idea'
  | 'voiceover'
  | 'imagery'
  | 'video'
  | 'thumbnail'
  | 'youtube';

export type StepStatus = 'idle' | 'running' | 'completed' | 'error';

export interface WorkflowStepState {
  id: StepIdentifier;
  label: string;
  status: StepStatus;
  detail?: string;
}

export type WorkflowStatus = 'queued' | 'running' | 'completed' | 'error';

export interface WorkflowResult {
  script: string;
  metadata: {
    title: string;
    keywords: string[];
    description: string;
    scheduledPublishTime?: string;
    youtubeVideoId?: string;
    youtubeVideoUrl?: string;
  };
  artifacts: {
    audioPath: string;
    videoPath: string;
    thumbnailPath: string;
  };
}

export interface WorkflowJob {
  id: string;
  status: WorkflowStatus;
  createdAt: number;
  updatedAt: number;
  steps: WorkflowStepState[];
  error?: string;
  result?: WorkflowResult;
}

export interface WorkflowPayload {
  sheetUrl?: string;
  sheetRowIndex?: number;
  storyScript?: string;
  customTitle?: string;
  keywords?: string;
  publishAt?: string;
}
