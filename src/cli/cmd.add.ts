import ora from 'ora';
import chalk from 'chalk';

export async function runAddCommand(packageName: string): Promise<void> {
  const spinner = ora(`Adding ${packageName}...`).start();

  try {
    spinner.succeed(chalk.green(`Added ${packageName} (stub)`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
