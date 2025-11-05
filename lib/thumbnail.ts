import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas';

const WIDTH = 1280;
const HEIGHT = 720;

export const buildThumbnail = async (
  heroImagePath: string,
  title: string,
  keywords: string[],
  outputDir: string
) => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext('2d');

  context.fillStyle = '#04060b';
  context.fillRect(0, 0, WIDTH, HEIGHT);

  try {
    const heroImage = await loadImage(heroImagePath);
    const ratio = Math.max(WIDTH / heroImage.width, HEIGHT / heroImage.height);
    const scaledWidth = heroImage.width * ratio;
    const scaledHeight = heroImage.height * ratio;
    const offsetX = (WIDTH - scaledWidth) / 2;
    const offsetY = (HEIGHT - scaledHeight) / 2;
    context.globalAlpha = 0.48;
    context.drawImage(heroImage, offsetX, offsetY, scaledWidth, scaledHeight);
    context.globalAlpha = 1;
  } catch {
    // ignore if hero image fails
  }

  const gradient = context.createLinearGradient(0, HEIGHT, WIDTH, HEIGHT / 3);
  gradient.addColorStop(0, 'rgba(12, 18, 45, 0.92)');
  gradient.addColorStop(1, 'rgba(12, 18, 45, 0.35)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = '#ffffff';
  context.font = 'bold 72px "Segoe UI", "Arial Black", sans-serif';
  context.textBaseline = 'top';

  const wrappedTitle = wrapText(context, title.toUpperCase(), WIDTH - 160);
  wrappedTitle.lines.forEach((line, index) => {
    context.fillText(line, 120, 120 + index * (wrappedTitle.lineHeight + 6));
  });

  context.font = '600 32px "Segoe UI", "Arial", sans-serif';
  context.fillStyle = '#9cb7ff';
  const tagLine = keywords.slice(0, 5).map((tag) => `#${tag.replace(/\s+/g, '')}`).join('   ');
  context.fillText(tagLine, 120, 120 + wrappedTitle.height + 36);

  const outputPath = path.join(outputDir, 'thumbnail.jpg');
  await fs.promises.writeFile(outputPath, canvas.toBuffer('image/jpeg', 0.92));
  return outputPath;
};

const wrapText = (context: SKRSContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words.shift() ?? '';
  while (words.length > 0) {
    const word = words.shift();
    if (!word) break;
    const testLine = `${currentLine} ${word}`.trim();
    const width = context.measureText(testLine).width;
    if (width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  const lineHeight = 72;
  return {
    lines,
    lineHeight,
    height: lineHeight * lines.length
  };
};
