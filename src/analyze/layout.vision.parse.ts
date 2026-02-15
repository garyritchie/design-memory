import type { Logger } from 'loglevel';

export function parseVisionResponse(
  content: string,
  logger?: Logger
): { ascii: string; description: string } {
  let ascii = '';
  let description = '';

  const codeBlockMatch = content.match(/```[\s\S]*?```/);
  if (codeBlockMatch) {
    ascii = codeBlockMatch[0]
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```/g, '')
      .trim();
    const parts = content.split('```');
    description = parts[0]?.trim() || '';
    if (parts.length > 2) {
      description += '\n\n' + parts.slice(2).join('```').trim();
    }
  } else {
    const lines = content.split('\n');
    const asciiStart = lines.findIndex(
      (l) =>
        l.includes('┌') ||
        l.includes('│') ||
        l.includes('─') ||
        l.includes('├') ||
        l.includes('┤') ||
        l.includes('└') ||
        l.includes('┘')
    );
    if (asciiStart >= 0) {
      ascii = lines.slice(asciiStart).join('\n').trim();
      description = lines.slice(0, asciiStart).join('\n').trim();
    } else {
      ascii = content;
      description = 'Layout analyzed from screenshot';
    }
  }

  if (!ascii || ascii.length < 50) {
    logger?.warn('ASCII diagram seems too short, attempting to extract from full response');
    const allLines = content.split('\n');
    const diagramLines = allLines.filter(
      (l) =>
        l.includes('┌') ||
        l.includes('│') ||
        l.includes('─') ||
        l.includes('├') ||
        l.includes('┤') ||
        l.includes('└') ||
        l.includes('┘') ||
        l.includes('Header') ||
        l.includes('Hero') ||
        l.includes('Nav') ||
        l.includes('Footer') ||
        l.trim().length > 0
    );
    if (diagramLines.length > 5) {
      ascii = diagramLines.join('\n');
    } else {
      ascii = content;
    }
  }

  return { ascii, description };
}
