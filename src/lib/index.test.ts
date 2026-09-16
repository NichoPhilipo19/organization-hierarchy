import { describe, expect, it } from 'vitest';
import * as Lib from './index';

/**
 * Pins the shape of the public API surface. Nothing here tests *behavior*
 * (that's what every other test file is for) — this file's only job is to
 * fail loudly the moment an export is accidentally renamed or dropped from
 * `index.ts`, since that's a breaking change for anyone who installed this
 * package from npm.
 */
describe('public API surface', () => {
  it('exposes the component exports', () => {
    // OrgChart is a forwardRef component — an object, not a plain function.
    expect(typeof Lib.OrgChart).toBe('object');
    expect(typeof Lib.NodeCard).toBe('function');
  });

  it('exposes the tree-building functions', () => {
    expect(typeof Lib.buildTree).toBe('function');
    expect(typeof Lib.idsUpToDepth).toBe('function');
    expect(typeof Lib.ancestorsOf).toBe('function');
    expect(typeof Lib.fromNested).toBe('function');
  });

  it('exposes the hooks', () => {
    expect(typeof Lib.useExpansion).toBe('function');
    expect(typeof Lib.useOrgTree).toBe('function');
  });

  it('exposes the theming exports', () => {
    expect(typeof Lib.getThemeStyle).toBe('function');
    expect(Array.isArray(Lib.THEME_ORDER)).toBe(true);
    expect(Lib.THEME_ORDER.length).toBeGreaterThan(0);
    expect(typeof Lib.THEMES).toBe('object');
  });

  it('does not export anything undefined (catches a typo in a re-export)', () => {
    for (const [name, value] of Object.entries(Lib)) {
      expect(value, `Lib.${name} should not be undefined`).not.toBeUndefined();
    }
  });
});
