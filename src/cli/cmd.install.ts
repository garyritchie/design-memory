import { existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { detectProject } from '../project/install.detect.js';
import { extractTokensFromDesignMemory } from '../project/install.tokens.js';
import { writeTokensToProject } from '../project/install.write.js';

export async function runInstallCommand(): Promise<void> {
  const spinner = ora(chalk.cyan('Installing design tokens...')).start();
  const root = process.cwd();

  try {
    // Check .design-memory exists
    const dmPath = join(root, '.design-memory');
    if (!existsSync(dmPath)) {
      spinner.fail(
        chalk.red('No .design-memory/ found. Run `design-memory learn <url>` first.')
      );
      process.exit(1);
    }

    // Detect project
    spinner.text = chalk.cyan('Detecting project framework...');
    const ctx = detectProject(root);

    spinner.text = chalk.cyan(`Detected: ${chalk.yellow(ctx.framework)}${ctx.hasTailwind ? ' + Tailwind' : ''}`);

    // Extract tokens
    spinner.text = chalk.cyan('Reading design tokens...');
    const tokens = await extractTokensFromDesignMemory(root);

    if (!tokens.cssVariablesBlock) {
      spinner.fail(
        chalk.red('No CSS tokens found in .design-memory/. Try running `design-memory learn <url>` again.')
      );
      process.exit(1);
    }

    // Write to project
    spinner.text = chalk.cyan('Writing tokens to project...');
    const written = await writeTokensToProject(ctx, tokens);

    if (written.length === 0) {
      spinner.info(chalk.yellow('Design tokens already installed (no changes needed).'));
      return;
    }

    spinner.succeed(chalk.green(`Design tokens installed to ${written.length} files`));

    for (const file of written) {
      console.log(chalk.dim(`   → ${file}`));
    }

    console.log(chalk.dim(`\n   Framework: ${ctx.framework}${ctx.hasTailwind ? ' + Tailwind' : ''}`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
