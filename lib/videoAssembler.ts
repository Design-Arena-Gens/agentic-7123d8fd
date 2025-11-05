import fs from 'fs';
import path from 'path';
import { getMediaDuration, runFfmpeg } from './mediaTools';

interface AssembleOptions {
  audioPath: string;
  imagePaths: string[];
  workspace: string;
}

export const assembleVideo = async ({ audioPath, imagePaths, workspace }: AssembleOptions) => {
  if (!imagePaths.length) {
    throw new Error('No imagery available for video');
  }
  const audioDuration = await getMediaDuration(audioPath);
  const safeDuration = Math.max(audioDuration || 0, imagePaths.length * 4);
  const perImageDuration = Math.max(safeDuration / imagePaths.length, 4);

  const listEntries = imagePaths
    .map((imagePath) => {
      const escaped = imagePath.replace(/'/g, "'\\''");
      return `file '${escaped}'\nduration ${perImageDuration.toFixed(3)}`;
    })
    .join('\n');
  const lastImage = imagePaths[imagePaths.length - 1].replace(/'/g, "'\\''");
  const concatDescriptor = `${listEntries}\nfile '${lastImage}'\n`;

  const concatFile = path.join(workspace, 'slideshow.txt');
  await fs.promises.writeFile(concatFile, concatDescriptor);

  const slideshowPath = path.join(workspace, 'slideshow.mp4');
  await runFfmpeg([
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatFile,
    '-vf',
    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    slideshowPath
  ]);

  const backgroundPath = path.join(workspace, 'ambient.wav');
  await runFfmpeg([
    '-y',
    '-f',
    'lavfi',
    '-i',
    `anoisesrc=color=pink:duration=${safeDuration.toFixed(3)}:amplitude=0.08` ,
    backgroundPath
  ]);

  const mixedAudioPath = path.join(workspace, 'voiceover-mix.mp3');
  await runFfmpeg([
    '-y',
    '-i',
    audioPath,
    '-i',
    backgroundPath,
    '-filter_complex',
    '[0:a]volume=1[a0];[1:a]volume=0.35[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=3[aout]',
    '-map',
    '[aout]',
    '-c:a',
    'mp3',
    mixedAudioPath
  ]);

  const finalPath = path.join(workspace, 'final-video.mp4');
  await runFfmpeg([
    '-y',
    '-i',
    slideshowPath,
    '-i',
    mixedAudioPath,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    '-movflags',
    '+faststart',
    finalPath
  ]);

  return {
    videoPath: finalPath,
    audioMixPath: mixedAudioPath,
    duration: safeDuration
  };
};
