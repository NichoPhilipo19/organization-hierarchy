import { describe, expect, it } from 'vitest';
import { getThemeStyle, THEME_ORDER, THEMES } from './themes';

describe('THEME_ORDER / THEMES', () => {
  it('THEME_ORDER lists exactly the keys of THEMES, no more no less', () => {
    expect(new Set(THEME_ORDER)).toEqual(new Set(Object.keys(THEMES)));
  });

  it('every non-default theme sets a font, a card background, and a focus color', () => {
    // 'default' is the deliberate exception: an empty vars object so the
    // component falls back entirely to its own CSS module defaults.
    for (const id of THEME_ORDER) {
      if (id === 'default') continue;
      const vars = THEMES[id].vars;
      expect(vars['--orgchart-font']).toBeTruthy();
      expect(vars['--orgchart-card-bg']).toBeTruthy();
      expect(vars['--orgchart-focus-color']).toBeTruthy();
    }
  });

  it("'default' is the deliberate empty baseline theme", () => {
    expect(THEMES.default.vars).toEqual({});
  });

  it('every theme has a non-empty label and description', () => {
    for (const id of THEME_ORDER) {
      expect(THEMES[id].label.length).toBeGreaterThan(0);
      expect(THEMES[id].description.length).toBeGreaterThan(0);
    }
  });

  it('every theme carries its own id matching its key in THEMES', () => {
    for (const id of THEME_ORDER) {
      expect(THEMES[id].id).toBe(id);
    }
  });
});

describe('getThemeStyle', () => {
  it('returns a fresh copy, not the internal THEMES reference', () => {
    const style = getThemeStyle('default') as Record<string, string>;
    style['--orgchart-card-bg'] = 'mutated';
    expect(THEMES.default.vars['--orgchart-card-bg']).not.toBe('mutated');
  });

  it('returns the same variables declared on the theme', () => {
    expect(getThemeStyle('saas')).toEqual(THEMES.saas.vars);
  });

  it('returns a distinct object per call', () => {
    expect(getThemeStyle('startup')).not.toBe(getThemeStyle('startup'));
  });
});
