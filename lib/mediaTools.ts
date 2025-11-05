import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegStatic ?? 'ffmpeg');
ffmpeg.setFfprobePath(ffprobeStatic.path);

export const runFfmpeg = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const executable = ffmpegStatic ?? 'ffmpeg';
    const process = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stderr: Buffer[] = [];
    process.stderr.on('data', (chunk) => {
      stderr.push(chunk as Buffer);
    });
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${Buffer.concat(stderr).toString('utf8')}`));
      }
    });
  });

export const getMediaDuration = (filePath: string) =>
  new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }
      const data = metadata as unknown as { format?: { duration?: number } };
      const duration = data.format?.duration ?? 0;
      resolve(duration);
    });
  });
