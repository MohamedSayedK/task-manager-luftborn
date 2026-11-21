import { filesOfProject } from 'tsarch';
import { describe, expect, it } from 'vitest';

const TS_CONFIG = 'tsconfig.arch.json';

// Note: tsarch's `inFolder('src')` matches nothing, so select files by path pattern.
const APP_FILES = String.raw`^src/.*\.ts$`;

describe('architecture: cycles', () => {
  it('the app has no circular dependencies', async () => {
    const rule = filesOfProject(TS_CONFIG).matchingPattern(APP_FILES).should().beFreeOfCycles();

    expect(await rule.check()).toEqual([]);
  });
});
