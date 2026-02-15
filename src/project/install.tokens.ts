import { existsSync } from 'fs';
import { join } from 'path';
import { readTextFile } from '../util/io.js';

export interface ExtractedTokens {
  cssVariablesBlock: string | null;
  tailwindExtendBlock: string | null;
}

/**
 * Read .design-memory/reference.md and extract the code-ready token blocks.
 */
export async function extractTokensFromDesignMemory(projectRoot: string): Promise<ExtractedTokens> {
  const refPath = join(projectRoot, '.design-memory', 'reference.md');
  const stylePath = join(projectRoot, '.design-memory', 'style.md');

  let content = '';
  if (existsSync(refPath)) {
    content = await readTextFile(refPath);
  } else if (existsSync(stylePath)) {
    content = await readTextFile(stylePath);
  } else {
    return { cssVariablesBlock: null, tailwindExtendBlock: null };
  }

  const cssVariablesBlock = extractCodeBlock(content, 'css', ':root');
  const tailwindExtendBlock = extractCodeBlock(content, 'js', 'extend:');

  return { cssVariablesBlock, tailwindExtendBlock };
}

/**
 * Extract a fenced code block from markdown that matches a language and contains a keyword.
 */
function extractCodeBlock(md: string, lang: string, keyword: string): string | null {
  const regex = new RegExp('```' + lang + '\\s*\\n([\\s\\S]*?)```', 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(md)) !== null) {
    const block = match[1]!.trim();
    if (block.includes(keyword)) {
      return block;
    }
  }

  return null;
}
