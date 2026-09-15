import { useChartContext } from './ChartContext';
import { NodeCard } from './NodeCard';
import s from './OrgChart.module.css';
import type { NodeState, TreeNode } from './types';

interface BranchProps {
  tree: TreeNode;
  /** aria-posinset — 1-based position among siblings. */
  posInSet: number;
  /** aria-setsize — number of siblings. */
  setSize: number;
}

export function Branch({ tree, posInSet, setSize }: BranchProps) {
  const { expanded, toggle, renderNode, onNodeClick, highlighted, tabbableId, onItemFocus } =
    useChartContext();

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
        // Only when the li itself receives focus (not bubbling from the toggle)
        if (e.target === e.currentTarget) onItemFocus(node.id);
      }}
    >
      <div className={s.nodeArea}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard activation is handled by the parent li[role=treeitem] via roving tabindex + Enter/Space (see onTreeKeyDown), not here */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: same as above, this onClick is a mouse-only duplicate of an action whose keyboard equivalent is already handled one level up */}
        <div
          className={
            [onNodeClick ? s.clickable : '', isHighlighted ? s.highlighted : '']
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
            tabIndex={-1} /* keyboard: handled via arrow keys on the treeitem (roving) */
            onClick={(e) => {
              e.stopPropagation(); // don't leak to onNodeClick (FR-4)
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
        /* Collapsed subtree isn't rendered at all (FR-10) */
        /* biome-ignore lint/a11y/useSemanticElements: role="group" here is part of the WAI-ARIA treeview pattern (subtree container), not a form grouping - fieldset does not apply */
        <ul className={s.level} role="group">
          {children.map((child, i) => (
            <Branch key={child.node.id} tree={child} posInSet={i + 1} setSize={children.length} />
          ))}
        </ul>
      )}
    </li>
  );
}
