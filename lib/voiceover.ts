import fs from 'fs';
import path from 'path';
import googleTTS from 'google-tts-api';
import { runFfmpeg } from './mediaTools';

const MAX_SEGMENT_LENGTH = 180;

export const synthesizeVoiceover = async (text: string, outputDir: string) => {
  if (!text.trim()) {
    throw new Error('Script is empty');
  }
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const segments = splitIntoSegments(cleaned);
  const segmentPaths: string[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const url = googleTTS.getAudioUrl(segment, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com'
    } as any);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TTS fetch failed: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const segmentPath = path.join(outputDir, `voiceover-${index}.mp3`);
    await fs.promises.writeFile(segmentPath, buffer);
    segmentPaths.push(segmentPath);
  }
  const outputPath = path.join(outputDir, 'voiceover.mp3');
  if (segmentPaths.length === 1) {
    await fs.promises.copyFile(segmentPaths[0], outputPath);
    return outputPath;
  }
  const concatDescriptor = segmentPaths
    .map((segmentPath) => `file '${segmentPath.replace(/'/g, "'\\''")}'`)
    .join('\n');
  const concatFile = path.join(outputDir, 'voiceover_concat.txt');
  await fs.promises.writeFile(concatFile, concatDescriptor);
  await runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', outputPath]);
  return outputPath;
};

const splitIntoSegments = (input: string) => {
  if (input.length <= MAX_SEGMENT_LENGTH) {
    return [input];
  }
  const sentences = input.match(/[^.!?]+[.!?]?/g) ?? [input];
  const segments: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const prospective = `${current} ${sentence}`.trim();
    if (prospective.length > MAX_SEGMENT_LENGTH && current) {
      segments.push(current.trim());
      current = sentence.trim();
    } else {
      current = prospective;
    }
  }
  if (current.trim()) {
    segments.push(current.trim());
  }
  return segments;
};
