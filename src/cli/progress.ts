import ora from 'ora';
import chalk from 'chalk';
import type { Ora } from 'ora';

export interface ProgressTracker {
  spinner: Ora;
  /** Move to the next step — updates the step counter and label */
  step(label: string): void;
  /** Mark the entire pipeline as done */
  succeed(message: string): void;
  /** Mark the entire pipeline as failed */
  fail(message: string): void;
  /** Get elapsed time since start in seconds */
  elapsed(): number;
}

/**
 * Create a progress tracker that displays [step/total] with elapsed time.
 *
 * Usage:
 *   const p = createProgress(5);
 *   p.step('Launching browser');     // [1/5] Launching browser... (0.0s)
 *   p.step('Extracting styles');     // [2/5] Extracting styles... (2.3s)
 *   p.succeed('Done');
 */
export function createProgress(totalSteps: number): ProgressTracker {
  const startTime = Date.now();
  let currentStep = 0;

  const spinner = ora({
    text: chalk.cyan('Starting...'),
    color: 'cyan',
  }).start();

  function elapsed(): number {
    return (Date.now() - startTime) / 1000;
  }

  function formatStep(label: string): string {
    const stepTag = chalk.dim(`[${currentStep}/${totalSteps}]`);
    const time = chalk.dim(`(${elapsed().toFixed(1)}s)`);
    return `${stepTag} ${chalk.cyan(label)} ${time}`;
  }

  return {
    spinner,

    step(label: string) {
      currentStep++;
      spinner.text = formatStep(label);
    },

    succeed(message: string) {
      const time = chalk.dim(`in ${elapsed().toFixed(1)}s`);
      spinner.succeed(chalk.green(`${message} ${time}`));
    },

    fail(message: string) {
      const time = chalk.dim(`after ${elapsed().toFixed(1)}s`);
      spinner.fail(chalk.red(`${message} ${time}`));
    },

    elapsed,
  };
}
