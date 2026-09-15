import { useMemo } from 'react';
import { buildTree } from './buildTree';
import type { BuildTreeResult, OrgNode } from './types';

/** Memoized buildTree — only rebuilds when the `data` reference changes. */
export function useOrgTree(data: OrgNode[]): BuildTreeResult {
  return useMemo(() => buildTree(data), [data]);
}
