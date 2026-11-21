import axe from 'axe-core';

interface Options {
  /**
   * Also run the rules that only make sense for a whole page (landmarks, one h1). Leave it off
   * when checking a single component.
   */
  page?: boolean;
}

/**
 * Fails when axe finds an accessibility violation inside `root`. Color contrast is not checked
 * because jsdom has no layout. It is covered by a scan in a real browser instead.
 */
export async function expectAccessible(root: Element, options: Options = {}): Promise<void> {
  const results = await axe.run(root, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: !!options.page },
      'page-has-heading-one': { enabled: !!options.page },
    },
  });
  const problems = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n` +
      violation.nodes.map((node) => `  ${node.html.slice(0, 140)}`).join('\n'),
  );
  expect(problems).toEqual([]);
}
