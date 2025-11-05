declare module 'fluent-ffmpeg' {
  import type { Readable } from 'stream';

  type Callback = (err: Error | null, stdout?: string, stderr?: string) => void;
  type FfprobeCallback = (err: Error | null, metadata: any) => void;

  interface FfmpegCommand {
    input: (source: string | Readable) => FfmpegCommand;
    inputOptions: (options: string[]) => FfmpegCommand;
    outputOptions: (options: string[]) => FfmpegCommand;
    save: (target: string) => FfmpegCommand;
    on: (event: 'start' | 'error' | 'end' | 'progress', handler: (...args: any[]) => void) => FfmpegCommand;
    ffprobe: (callback: FfprobeCallback) => void;
  }

  interface FfmpegStatic {
    (input?: string | Readable): FfmpegCommand;
    setFfmpegPath: (path: string) => void;
    setFfprobePath: (path: string) => void;
    ffprobe: (path: string, callback: FfprobeCallback) => void;
  }

  const ffmpeg: FfmpegStatic;
  export default ffmpeg;
}
