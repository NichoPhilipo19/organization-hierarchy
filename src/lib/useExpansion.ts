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
 * Controlled/uncontrolled expand state (FR-6), mengikuti konvensi value/defaultValue.
 * Set berisi id node yang TERBUKA → node baru otomatis collapsed.
 *
 * Perilaku saat `data` berubah (uncontrolled) — Technical Design §7:
 * `defaultExpandedDepth` diterapkan ulang terhadap tree baru. Konsekuensinya
 * `data` harus referentially stable antar render (bukan array inline) —
 * sama seperti syarat memoization di useOrgTree.
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

  // Reset state internal saat tree berubah identitas (data baru) —
  // pola "derive state during render" dari dokumentasi React.
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
