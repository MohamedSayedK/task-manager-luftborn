import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

/**
 * Module boundaries for the app. See docs/architecture-boundaries.md.
 *
 * Structure: src/app/<domain>/<layer>, where <domain> is `tasks`, `dashboard`
 * or `shared`, and <layer> is `feature-<name>`, `ui`, `data` or `util`.
 */
export const config: SheriffConfig = {
  version: 1,
  entryFile: 'src/main.ts',
  enableBarrelLess: true,
  modules: {
    'src/app/<domain>/feature-<feature>': ['domain:<domain>', 'layer:feature'],
    'src/app/<domain>/ui': ['domain:<domain>', 'layer:ui'],
    'src/app/<domain>/data': ['domain:<domain>', 'layer:data'],
    'src/app/<domain>/util': ['domain:<domain>', 'layer:util'],
  },
  depRules: {
    // The app root (shell, routes, config) may reach every module.
    root: ['domain:*', 'layer:*'],
    noTag: ['noTag'],

    // Domains: a domain only sees itself and the shared area.
    'domain:tasks': [sameTag, 'domain:shared'],
    'domain:dashboard': [sameTag, 'domain:shared'],
    'domain:shared': [sameTag],

    // Relaxed layering: feature -> ui -> data -> util (layers may be skipped).
    'layer:feature': ['layer:ui', 'layer:data', 'layer:util'],
    'layer:ui': ['layer:data', 'layer:util'],
    'layer:data': ['layer:util'],
    'layer:util': [],
  },
};
