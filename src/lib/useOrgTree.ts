import { useMemo } from 'react';
import { buildTree } from './buildTree';
import type { BuildTreeResult, OrgNode } from './types';

/** Memoized buildTree — hanya rebuild saat referensi `data` berubah. */
export function useOrgTree(data: OrgNode[]): BuildTreeResult {
  return useMemo(() => buildTree(data), [data]);
}
