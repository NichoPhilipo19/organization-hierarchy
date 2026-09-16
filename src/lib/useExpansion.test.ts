// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildTree } from './buildTree';
import { useExpansion } from './useExpansion';

const { roots } = buildTree([
  { id: 'ceo', parentId: null, name: 'Cee O' },
  { id: 'cto', parentId: 'ceo', name: 'Tee O' },
]);

describe('useExpansion — controlled mode (FR-6)', () => {
  it('toggle with no onExpandedChange does not throw and leaves expandedIds untouched', () => {
    const expandedIds = new Set(['ceo']);
    const { result } = renderHook(() => useExpansion({ roots, expandedIds }));

    expect(() => {
      act(() => {
        result.current.toggle('cto');
      });
    }).not.toThrow();

    // Controlled mode: the hook never mutates the caller's set itself, and
    // with no onExpandedChange there's no state update to reflect either —
    // `expanded` still reports exactly what the caller passed in.
    expect(result.current.expanded).toBe(expandedIds);
  });
});

describe('useExpansion — uncontrolled mode, no onExpandedChange (FR-6)', () => {
  it('toggle updates internal state without throwing when onExpandedChange is omitted', () => {
    const { result } = renderHook(() => useExpansion({ roots }));
    expect(result.current.expanded.has('cto')).toBe(false);

    expect(() => {
      act(() => {
        result.current.toggle('cto');
      });
    }).not.toThrow();

    expect(result.current.expanded.has('cto')).toBe(true);
  });

  it('toggle also notifies onExpandedChange when provided in uncontrolled mode', () => {
    const onExpandedChange = vi.fn();
    const { result } = renderHook(() => useExpansion({ roots, onExpandedChange }));

    act(() => {
      result.current.toggle('cto');
    });

    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['ceo', 'cto']));
    expect(result.current.expanded.has('cto')).toBe(true);
  });
});
