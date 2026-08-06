import type { OrgNode } from './types';
import s from './OrgChart.module.css';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/** Kartu default — zero-config (FR-9). Theming via CSS custom properties (OQ-3). */
export function NodeCard({ node }: { node: OrgNode }) {
  return (
    <div className={s.card}>
      {node.avatarUrl ? (
        <img className={s.avatar} src={node.avatarUrl} alt="" />
      ) : (
        <div className={s.avatar} aria-hidden="true">
          {initials(node.name) || node.id.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className={s.cardText}>
        <div className={s.cardName}>{node.name || node.id}</div>
        {node.title && <div className={s.cardTitle}>{node.title}</div>}
      </div>
    </div>
  );
}
