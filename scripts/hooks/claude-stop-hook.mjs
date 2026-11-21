import { runChecks } from '../ci-checks.mjs';

/** Reads the hook's JSON input from stdin. Returns `{}` when it is empty or invalid. */
async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    return {};
  }
}

/**
 * Claude Code Stop hook. Runs the fast architecture checks when Claude finishes a turn.
 * Exit code 2 blocks the stop and sends stderr back to Claude so it fixes the violation.
 *
 * `stop_hook_active` is true when Claude is already continuing because of this hook.
 * Then the hook lets Claude stop even if the checks still fail, so it cannot loop forever.
 */
const input = await readInput();
const result = runChecks({ capture: true });

if (result.status === 'error') {
  if (input.stop_hook_active) {
    process.stderr.write(
      `Checks still failing after one retry, not blocking again.\n${result.message}`,
    );
    process.exit(0);
  }
  process.stderr.write(result.message);
  process.exit(2);
}

process.exit(0);
