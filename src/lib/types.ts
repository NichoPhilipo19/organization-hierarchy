import type { ReactNode } from 'react';

/** Satu node organisasi — bentuk flat, natural dari API/DB. (FR-1) */
export interface OrgNode {
  id: string;
  /** `null` = root. Beberapa root = multi-company. (FR-2) */
  parentId: string | null;
  name: string;
  title?: string;
  avatarUrl?: string;
  /** Payload bebas milik konsumen — dilewatkan apa adanya ke renderNode. */
  data?: Record<string, unknown>;
}

/** Node internal hasil buildTree. */
export interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
  depth: number;
}

export type TreeErrorType = 'orphan' | 'cycle' | 'duplicate';

/** Laporan data kotor — chart tetap render sebisanya. (FR-7) */
export interface TreeError {
  type: TreeErrorType;
  nodeId: string;
  message: string;
}

export interface BuildTreeResult {
  roots: TreeNode[];
  errors: TreeError[];
}

/** State node yang diberikan ke renderNode. (FR-8) */
export interface NodeState {
  isExpanded: boolean;
  hasChildren: boolean;
  childCount: number;
  depth: number;
  /** True jika id node ada di `highlightedIds`. (v2 — search/highlight) */
  isHighlighted: boolean;
}

/** Bentuk nested untuk helper fromNested() — konversi one-way ke flat. */
export interface NestedOrgNode extends Omit<OrgNode, 'parentId'> {
  children?: NestedOrgNode[];
}

/** Imperative handle — `useRef<OrgChartHandle>` + prop `ref`. (US-10) */
export interface OrgChartHandle {
  /** Expand semua node yang punya anak. */
  expandAll(): void;
  /** Collapse semua node. */
  collapseAll(): void;
  /**
   * Export tree yang sedang ter-render (node visible saja, mengabaikan
   * zoom/pan saat ini) ke file PNG. Menolak jika chart belum ter-mount
   * (misal `data` kosong). (FR-12)
   */
  exportToPng(filename?: string): Promise<void>;
}

export interface OrgChartProps {
  data: OrgNode[];

  /** Override tampilan node sepenuhnya. Default: kartu bawaan. (FR-8, FR-9) */
  renderNode?: (node: OrgNode, state: NodeState) => ReactNode;

  /** Uncontrolled: expand semua node dengan depth < nilai ini. Default 1. (FR-3) */
  defaultExpandedDepth?: number;
  /** Controlled mode. Jika diberikan, internal state diabaikan. (FR-6) */
  expandedIds?: ReadonlySet<string>;
  onExpandedChange?: (ids: Set<string>) => void;

  /** Klik kartu — terpisah dari toggle expand. (FR-4) */
  onNodeClick?: (node: OrgNode) => void;

  /**
   * Node yang di-highlight (misal hasil search). Kartu default diberi ring;
   * renderNode custom menerima `state.isHighlighted`.
   * Gunakan `ancestorsOf()` untuk auto-expand path ke node hasil search.
   */
  highlightedIds?: ReadonlySet<string>;

  /** Aktifkan zoom (scroll/tombol) & pan (drag). Default false. (v2) */
  zoomable?: boolean;

  /** Dipanggil saat buildTree menemukan orphan/cycle/duplicate. (FR-7) */
  onDataError?: (errors: TreeError[]) => void;

  /** Ditampilkan saat data kosong. */
  emptyState?: ReactNode;

  className?: string;
}
