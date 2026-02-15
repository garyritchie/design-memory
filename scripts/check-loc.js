import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const MAX_LOC = 150;

function countLines(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  return lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//');
  }).length;
}

function checkDirectory(dir, extensions = ['.ts', '.tsx']) {
  const files = readdirSync(dir);
  const violations = [];

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      violations.push(...checkDirectory(fullPath, extensions));
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      const loc = countLines(fullPath);
      if (loc > MAX_LOC) {
        violations.push({ path: fullPath, loc });
      }
    }
  }

  return violations;
}

const srcDir = join(process.cwd(), 'src');
const violations = checkDirectory(srcDir);

if (violations.length > 0) {
  console.error(`❌ Found ${violations.length} file(s) exceeding ${MAX_LOC} LOC:\n`);
  for (const { path, loc } of violations) {
    console.error(`  ${path}: ${loc} lines`);
  }
  process.exit(1);
}

console.log(`✅ All source files are under ${MAX_LOC} LOC`);
process.exit(0);
