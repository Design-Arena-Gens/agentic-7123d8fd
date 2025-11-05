import fs from 'fs';
import path from 'path';

export const generateImageSet = async (prompts: string[], outputDir: string) => {
  if (!prompts.length) {
    throw new Error('No prompts to render');
  }
  const results: string[] = [];
  for (let index = 0; index < prompts.length; index += 1) {
    const prompt = prompts[index];
    const seed = encodeURIComponent(prompt.toLowerCase().replace(/\s+/g, '-'));
    const url = `https://source.unsplash.com/1280x720/?${seed}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Image fetch failed for prompt: ${prompt}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const imagePath = path.join(outputDir, `frame-${index}.jpg`);
    await fs.promises.writeFile(imagePath, buffer);
    results.push(imagePath);
  }
  return results;
};
