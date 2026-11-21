import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Quick checks, run by the Claude Stop hook after every turn. */
export const fastSteps = ['npm run sheriff', 'npm run test:arch', 'npm run lint'];

/** Slower checks, only run with `npm run ci`. */
export const fullOnlySteps = ['npm run format:check', 'npm run test:coverage', 'npx ng build'];

/**
 * Runs the checks in order and stops at the first failure.
 *
 * @param options.full Also run the slow steps.
 * @param options.capture Capture output into the result instead of printing it.
 */
export function runChecks({ full = false, capture = false } = {}) {
  const steps = full ? [...fastSteps, ...fullOnlySteps] : fastSteps;

  for (const step of steps) {
    try {
      execSync(step, {
        cwd: root,
        encoding: 'utf8',
        stdio: capture ? 'pipe' : 'inherit',
      });
    } catch (error) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}` || error.message;
      return { status: 'error', message: `Check failed: ${step}\n\n${output}` };
    }
  }

  return { status: 'success' };
}

// CLI: `node scripts/ci-checks.mjs [--full]`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runChecks({ full: process.argv.includes('--full') });
  if (result.status === 'error') {
    console.error(result.message);
    process.exit(1);
  }
}
