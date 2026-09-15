import type { ReactNode } from 'react';

/** A single organization node — flat shape, natural for API/DB. (FR-1) */
export interface OrgNode {
  id: string;
  /** `null` = root. Multiple roots = multi-company. (FR-2) */
  parentId: string | null;
  name: string;
  title?: string;
  avatarUrl?: string;
  /** Free-form payload owned by the consumer — passed through as-is to renderNode. */
  data?: Record<string, unknown>;
}

/** Internal node produced by buildTree. */
export interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
  depth: number;
}

export type TreeErrorType = 'orphan' | 'cycle' | 'duplicate';

/** Report of dirty data — the chart still renders as best it can. (FR-7) */
export interface TreeError {
  type: TreeErrorType;
  nodeId: string;
  message: string;
}

export interface BuildTreeResult {
  roots: TreeNode[];
  errors: TreeError[];
}

/** Node state passed to renderNode. (FR-8) */
export interface NodeState {
  isExpanded: boolean;
  hasChildren: boolean;
  childCount: number;
  depth: number;
  /** True if the node's id is in `highlightedIds`. (v2 — search/highlight) */
  isHighlighted: boolean;
}

/** Nested shape for the fromNested() helper — one-way conversion to flat. */
export interface NestedOrgNode extends Omit<OrgNode, 'parentId'> {
  children?: NestedOrgNode[];
}

/** Imperative handle — `useRef<OrgChartHandle>` + the `ref` prop. (US-10) */
export interface OrgChartHandle {
  /** Expand every node that has children. */
  expandAll(): void;
  /** Collapse every node. */
  collapseAll(): void;
  /**
   * Exports the currently rendered tree (visible nodes only, ignoring the
   * current zoom/pan) to a PNG file. Rejects if the chart isn't mounted yet
   * (e.g. `data` is empty). (FR-12)
   */
  exportToPng(filename?: string): Promise<void>;
}

export interface OrgChartProps {
  data: OrgNode[];

  /** Fully override node rendering. Default: the built-in card. (FR-8, FR-9) */
  renderNode?: (node: OrgNode, state: NodeState) => ReactNode;

  /** Uncontrolled: expand every node with depth < this value. Default 1. (FR-3) */
  defaultExpandedDepth?: number;
  /** Controlled mode. When provided, internal state is ignored. (FR-6) */
  expandedIds?: ReadonlySet<string>;
  onExpandedChange?: (ids: Set<string>) => void;

  /** Card click — separate from the expand toggle. (FR-4) */
  onNodeClick?: (node: OrgNode) => void;

  /**
   * Nodes to highlight (e.g. search results). The default card gets a ring;
   * a custom renderNode receives `state.isHighlighted`.
   * Use `ancestorsOf()` to auto-expand the path to a search-result node.
   */
  highlightedIds?: ReadonlySet<string>;

  /** Enable zoom (scroll/buttons) & pan (drag). Default false. (v2) */
  zoomable?: boolean;

  /** Called when buildTree finds an orphan/cycle/duplicate. (FR-7) */
  onDataError?: (errors: TreeError[]) => void;

  /** Rendered when data is empty. */
  emptyState?: ReactNode;

  className?: string;
}
