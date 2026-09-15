import { useCallback, useState } from 'react';
import { idsUpToDepth } from './buildTree';
import type { TreeNode } from './types';

interface UseExpansionArgs {
  roots: TreeNode[];
  defaultExpandedDepth?: number;
  expandedIds?: ReadonlySet<string>;
  onExpandedChange?: (ids: Set<string>) => void;
}

/**
 * Controlled/uncontrolled expand state (FR-6), following the value/defaultValue convention.
 * The set holds ids of OPEN nodes → new nodes are collapsed by default.
 *
 * Behavior when `data` changes (uncontrolled) — Technical Design §7:
 * `defaultExpandedDepth` is reapplied against the new tree. Consequently
 * `data` must be referentially stable across renders (not an inline array) —
 * the same requirement as the memoization in useOrgTree.
 */
export function useExpansion({
  roots,
  defaultExpandedDepth = 1,
  expandedIds,
  onExpandedChange,
}: UseExpansionArgs) {
  const [internal, setInternal] = useState<ReadonlySet<string>>(() =>
    idsUpToDepth(roots, defaultExpandedDepth),
  );

  // Reset internal state when the tree's identity changes (new data) —
  // the "derive state during render" pattern from the React docs.
  const [prevRoots, setPrevRoots] = useState(roots);
  if (prevRoots !== roots) {
    setPrevRoots(roots);
    setInternal(idsUpToDepth(roots, defaultExpandedDepth));
  }

  const isControlled = expandedIds !== undefined;
  const expanded = isControlled ? expandedIds : internal;

  const setExpanded = useCallback(
    (next: Set<string>) => {
      if (isControlled) onExpandedChange?.(next);
      else {
        setInternal(next);
        onExpandedChange?.(next);
      }
    },
    [isControlled, onExpandedChange],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(expanded);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpanded(next);
    },
    [expanded, setExpanded],
  );

  return { expanded, toggle, setExpanded };
}
