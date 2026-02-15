import { existsSync } from 'fs';
import { join } from 'path';

export interface ProjectContext {
  framework: 'nextjs' | 'vite' | 'cra' | 'plain';
  hasTailwind: boolean;
  globalsPath: string;
  tailwindConfigPath: string | null;
  tokensDir: string;
}

/**
 * Detect the project's frontend framework and Tailwind usage.
 */
export function detectProject(projectRoot: string): ProjectContext {
  const pkg = readPkg(projectRoot);
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };

  // Framework detection
  let framework: ProjectContext['framework'] = 'plain';
  if (deps['next']) {
    framework = 'nextjs';
  } else if (deps['react-scripts']) {
    framework = 'cra';
  } else if (deps['vite']) {
    framework = 'vite';
  }

  // Tailwind detection
  const hasTailwind =
    !!deps['tailwindcss'] ||
    existsSync(join(projectRoot, 'tailwind.config.js')) ||
    existsSync(join(projectRoot, 'tailwind.config.ts')) ||
    existsSync(join(projectRoot, 'tailwind.config.mjs'));

  // Globals CSS path
  const globalsPath = resolveGlobalsPath(projectRoot, framework);

  // Tailwind config path
  let tailwindConfigPath: string | null = null;
  if (hasTailwind) {
    for (const name of ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs']) {
      if (existsSync(join(projectRoot, name))) {
        tailwindConfigPath = join(projectRoot, name);
        break;
      }
    }
  }

  // Tokens directory
  const tokensDir = existsSync(join(projectRoot, 'src')) ? join(projectRoot, 'src') : projectRoot;

  return { framework, hasTailwind, globalsPath, tailwindConfigPath, tokensDir };
}

function readPkg(root: string): Record<string, Record<string, string>> | null {
  try {
    const pkgPath = join(root, 'package.json');
    if (!existsSync(pkgPath)) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return JSON.parse(require('fs').readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }
}

function resolveGlobalsPath(root: string, framework: ProjectContext['framework']): string {
  const candidates: string[] = [];

  if (framework === 'nextjs') {
    candidates.push('app/globals.css', 'styles/globals.css', 'src/app/globals.css');
  } else if (framework === 'vite' || framework === 'cra') {
    candidates.push('src/index.css', 'src/styles/globals.css', 'src/globals.css');
  }

  // Common fallbacks
  candidates.push('styles/globals.css', 'css/globals.css', 'globals.css');

  for (const c of candidates) {
    if (existsSync(join(root, c))) {
      return join(root, c);
    }
  }

  // Default: create in the first framework-appropriate location
  if (framework === 'nextjs') return join(root, 'app', 'globals.css');
  if (framework === 'vite' || framework === 'cra') return join(root, 'src', 'index.css');
  return join(root, 'styles', 'globals.css');
}
