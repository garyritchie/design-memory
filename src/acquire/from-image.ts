import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { hashBuffer } from '../util/hash.js';
import type { CaptureBundle } from './capture.js';

/**
 * Build a CaptureBundle from a local image file (screenshot, Figma export, etc.).
 * Skips crawl and computed styles — only provides screenshot for vision analysis.
 */
export async function acquireFromImage(imagePath: string): Promise<CaptureBundle> {
  if (!existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const buffer = await readFile(imagePath);
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Invalid image file: ${imagePath}`);
  }

  const hash = hashBuffer(buffer);

  return {
    url: `file://${imagePath}`,
    crawl: {
      url: `file://${imagePath}`,
      html: '',
      finalUrl: `file://${imagePath}`,
    },
    screenshot: {
      hash,
      buffer,
      width: metadata.width,
      height: metadata.height,
    },
    styles: [],
    variables: [],
  };
}
