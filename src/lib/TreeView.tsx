import { useChartContext } from './ChartContext';
import { NodeCard } from './NodeCard';
import type { NodeState, TreeNode } from './types';
import s from './OrgChart.module.css';

interface BranchProps {
  tree: TreeNode;
  /** aria-posinset — posisi 1-based di antara siblings. */
  posInSet: number;
  /** aria-setsize — jumlah siblings. */
  setSize: number;
}

export function Branch({ tree, posInSet, setSize }: BranchProps) {
  const {
    expanded,
    toggle,
    renderNode,
    onNodeClick,
    highlighted,
    tabbableId,
    onItemFocus,
  } = useChartContext();

  const { node, children, depth } = tree;
  const hasChildren = children.length > 0;
  const isExpanded = hasChildren && expanded.has(node.id);
  const isHighlighted = highlighted?.has(node.id) ?? false;
  const state: NodeState = {
    isExpanded,
    hasChildren,
    childCount: children.length,
    depth,
    isHighlighted,
  };

  return (
    <li
      className={s.branch}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-level={depth + 1}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-selected={isHighlighted || undefined}
      data-orgchart-node={node.id}
      tabIndex={node.id === tabbableId ? 0 : -1}
      onFocus={(e) => {
        // Hanya saat li-nya sendiri yang fokus (bukan bubbling dari toggle)
        if (e.target === e.currentTarget) onItemFocus(node.id);
      }}
    >
      <div className={s.nodeArea}>
        <div
          className={
            [
              onNodeClick ? s.clickable : '',
              isHighlighted ? s.highlighted : '',
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          onClick={onNodeClick ? () => onNodeClick(node) : undefined}
        >
          {renderNode ? renderNode(node, state) : <NodeCard node={node} />}
        </div>
        {hasChildren && (
          <button
            type="button"
            className={s.toggle}
            tabIndex={-1} /* keyboard: pakai arrow keys di treeitem (roving) */
            onClick={(e) => {
              e.stopPropagation(); // jangan bocor ke onNodeClick (FR-4)
              toggle(node.id);
            }}
            aria-label={
              isExpanded
                ? `Collapse ${children.length} direct reports of ${node.name}`
                : `Expand ${children.length} direct reports of ${node.name}`
            }
          >
            {isExpanded ? '−' : children.length /* badge count (FR-5) */}
          </button>
        )}
      </div>
      {isExpanded && (
        /* Subtree collapsed tidak di-render sama sekali (FR-10) */
        <ul className={s.level} role="group">
          {children.map((child, i) => (
            <Branch
              key={child.node.id}
              tree={child}
              posInSet={i + 1}
              setSize={children.length}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
