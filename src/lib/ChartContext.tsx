import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { NodeState, OrgNode } from './types';

export interface ChartContextValue {
  expanded: ReadonlySet<string>;
  toggle: (id: string) => void;
  renderNode?: (node: OrgNode, state: NodeState) => ReactNode;
  onNodeClick?: (node: OrgNode) => void;
  /** Node yang di-highlight (search). */
  highlighted?: ReadonlySet<string>;
  /** Roving tabindex (WAI-ARIA tree): satu-satunya treeitem dengan tabIndex 0. */
  tabbableId: string | null;
  /** Dipanggil saat sebuah treeitem menerima focus (klik/Tab). */
  onItemFocus: (id: string) => void;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export const ChartProvider = ChartContext.Provider;

export function useChartContext(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('OrgChart internals must be rendered inside <OrgChart>');
  return ctx;
}
