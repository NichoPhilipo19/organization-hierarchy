'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent } from 'react';
import { ChartProvider } from './ChartContext';
import { Branch } from './TreeView';
import { useExpansion } from './useExpansion';
import { useOrgTree } from './useOrgTree';
import { ZoomPane } from './ZoomPane';
import type { OrgChartHandle, OrgChartProps, TreeNode } from './types';
import s from './OrgChart.module.css';

/** Node yang terlihat (ancestor-nya expanded), urutan DFS = urutan visual/keyboard. */
function flattenVisible(
  roots: TreeNode[],
  expanded: ReadonlySet<string>,
): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (tn: TreeNode) => {
    out.push(tn);
    if (tn.children.length > 0 && expanded.has(tn.node.id)) {
      tn.children.forEach(walk);
    }
  };
  roots.forEach(walk);
  return out;
}

/**
 * <OrgChart data={flatArray} /> — org chart siap pakai (US-1).
 * Lihat PRD.md & TECHNICAL_DESIGN.md untuk keputusan desain.
 */
export const OrgChart = forwardRef<OrgChartHandle, OrgChartProps>(
  function OrgChart(
    {
      data,
      renderNode,
      defaultExpandedDepth,
      expandedIds,
      onExpandedChange,
      onNodeClick,
      onDataError,
      highlightedIds,
      zoomable = false,
      emptyState,
      className,
    },
    ref,
  ) {
    const { roots, errors } = useOrgTree(data);

    // T-2: callback disimpan di ref supaya effect hanya di-trigger oleh `errors`.
    // Konsumen boleh menulis onDataError inline tanpa menyebabkan re-fire.
    const onDataErrorRef = useRef(onDataError);
    useEffect(() => {
      onDataErrorRef.current = onDataError;
    });
    useEffect(() => {
      if (errors.length > 0) onDataErrorRef.current?.(errors);
    }, [errors]);

    const { expanded, toggle, setExpanded } = useExpansion({
      roots,
      defaultExpandedDepth,
      expandedIds,
      onExpandedChange,
    });

    // ---- Imperative handle: expandAll / collapseAll (US-10) ----
    const parentIds = useMemo(() => {
      const ids = new Set<string>();
      const walk = (tn: TreeNode) => {
        if (tn.children.length > 0) {
          ids.add(tn.node.id);
          tn.children.forEach(walk);
        }
      };
      roots.forEach(walk);
      return ids;
    }, [roots]);

    useImperativeHandle(
      ref,
      () => ({
        expandAll: () => setExpanded(new Set(parentIds)),
        collapseAll: () => setExpanded(new Set()),
      }),
      [parentIds, setExpanded],
    );

    // ---- Keyboard navigation (WAI-ARIA tree, US-11) ----
    const treeRef = useRef<HTMLUListElement>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);

    const visible = useMemo(
      () => flattenVisible(roots, expanded),
      [roots, expanded],
    );
    const nodeById = useMemo(() => {
      const m = new Map<string, TreeNode>();
      const walk = (tn: TreeNode) => {
        m.set(tn.node.id, tn);
        tn.children.forEach(walk);
      };
      roots.forEach(walk);
      return m;
    }, [roots]);
    const parentOf = useMemo(() => {
      const m = new Map<string, TreeNode | null>();
      const walk = (tn: TreeNode, parent: TreeNode | null) => {
        m.set(tn.node.id, parent);
        tn.children.forEach((c) => walk(c, tn));
      };
      roots.forEach((r) => walk(r, null));
      return m;
    }, [roots]);

    // Roving tabindex: focusedId kalau masih terlihat, kalau tidak node pertama.
    const visibleIds = useMemo(
      () => new Set(visible.map((v) => v.node.id)),
      [visible],
    );
    const tabbableId =
      focusedId && visibleIds.has(focusedId)
        ? focusedId
        : (visible[0]?.node.id ?? null);

    const focusById = (id: string) => {
      setFocusedId(id);
      treeRef.current
        ?.querySelector<HTMLElement>(
          `[data-orgchart-node="${CSS.escape(id)}"]`,
        )
        ?.focus();
    };

    const onTreeKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
      const target = e.target as HTMLElement;
      // Hanya tangani saat fokus di treeitem-nya sendiri (bukan tombol di dalamnya)
      if (target.getAttribute('role') !== 'treeitem') return;
      const id = target.dataset['orgchartNode'];
      if (!id) return;
      const tn = nodeById.get(id);
      if (!tn) return;
      const idx = visible.findIndex((v) => v.node.id === id);
      const hasChildren = tn.children.length > 0;
      const isOpen = hasChildren && expanded.has(id);

      switch (e.key) {
        case 'ArrowDown':
          if (idx >= 0 && idx + 1 < visible.length)
            focusById(visible[idx + 1]!.node.id);
          break;
        case 'ArrowUp':
          if (idx > 0) focusById(visible[idx - 1]!.node.id);
          break;
        case 'ArrowRight':
          if (hasChildren && !isOpen) toggle(id);
          else if (isOpen) focusById(tn.children[0]!.node.id);
          break;
        case 'ArrowLeft': {
          if (isOpen) toggle(id);
          else {
            const parent = parentOf.get(id);
            if (parent) focusById(parent.node.id);
          }
          break;
        }
        case 'Home':
          if (visible.length > 0) focusById(visible[0]!.node.id);
          break;
        case 'End':
          if (visible.length > 0)
            focusById(visible[visible.length - 1]!.node.id);
          break;
        case 'Enter':
        case ' ':
          if (onNodeClick) onNodeClick(tn.node);
          else if (hasChildren) toggle(id);
          break;
        default:
          return; // key lain: jangan preventDefault
      }
      e.preventDefault();
    };

    const ctx = useMemo(
      () => ({
        expanded,
        toggle,
        renderNode,
        onNodeClick,
        highlighted: highlightedIds,
        tabbableId,
        onItemFocus: setFocusedId,
      }),
      [expanded, toggle, renderNode, onNodeClick, highlightedIds, tabbableId],
    );

    const containerClass = [
      s.chart,
      zoomable ? s.chartZoomable : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    if (data.length === 0) {
      return (
        <div className={containerClass}>
          {emptyState ?? <p className={s.empty}>No organization data</p>}
        </div>
      );
    }

    const tree = (
      <ChartProvider value={ctx}>
        <ul
          ref={treeRef}
          className={s.root}
          role="tree"
          aria-label="Organization chart"
          onKeyDown={onTreeKeyDown}
        >
          {roots.map((root, i) => (
            <Branch
              key={root.node.id}
              tree={root}
              posInSet={i + 1}
              setSize={roots.length}
            />
          ))}
        </ul>
      </ChartProvider>
    );

    return (
      <div className={containerClass}>
        {zoomable ? <ZoomPane>{tree}</ZoomPane> : tree}
      </div>
    );
  },
);
