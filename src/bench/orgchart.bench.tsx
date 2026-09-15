/**
 * Benchmark for NFR-1 (T-6) — run with `npm run bench`.
 *
 * Method: renderToString measures the cost of pure React rendering (no
 * browser DOM commit), buildTree is measured directly. Absolute numbers
 * depend on hardware; what matters is order of magnitude vs. the NFR-1
 * target (<100ms initial, <16ms toggle).
 */

import { renderToString } from 'react-dom/server';
import { bench, describe } from 'vitest';
import { buildTree, idsUpToDepth } from '../lib/buildTree';
import { OrgChart } from '../lib/OrgChart';
import type { OrgNode } from '../lib/types';

/** Synthetic org: every node has `branching` children until the total reaches n. */
function makeOrg(n: number, branching = 4): OrgNode[] {
  const nodes: OrgNode[] = [{ id: 'n0', parentId: null, name: 'Root 0' }];
  for (let i = 1; i < n; i++) {
    nodes.push({
      id: `n${i}`,
      parentId: `n${Math.floor((i - 1) / branching)}`,
      name: `Person ${i}`,
      title: i % 3 === 0 ? 'Manager' : 'Staff',
    });
  }
  return nodes;
}

const org100 = makeOrg(100);
const org1000 = makeOrg(1000);
const org10000 = makeOrg(10000);

describe('buildTree (O(n) claim, Technical Design §1)', () => {
  bench('100 nodes', () => {
    buildTree(org100);
  });
  bench('1,000 nodes', () => {
    buildTree(org1000);
  });
  bench('10,000 nodes', () => {
    buildTree(org10000);
  });
});

describe('render (NFR-1: <100ms for 100 nodes, ~20% expanded)', () => {
  // ~20% expanded ≈ depth 2 at branching 4
  const { roots } = buildTree(org100);
  const partial = idsUpToDepth(roots, 2);
  const all = new Set(org100.map((n) => n.id));

  bench('100 nodes, ~20% expanded (NFR-1 scenario)', () => {
    renderToString(<OrgChart data={org100} expandedIds={partial} />);
  });
  bench('100 nodes, all expanded', () => {
    renderToString(<OrgChart data={org100} expandedIds={all} />);
  });

  const { roots: r1000 } = buildTree(org1000);
  const partial1000 = idsUpToDepth(r1000, 3);
  bench('1,000 nodes, depth 3 expanded', () => {
    renderToString(<OrgChart data={org1000} expandedIds={partial1000} />);
  });
});

describe('toggle path (approx <16ms): re-render after 1 toggle', () => {
  // Toggle = re-render with a Set differing by 1 member; the visible subtree re-renders.
  const { roots } = buildTree(org100);
  const base = idsUpToDepth(roots, 2);
  const toggled = new Set(base);
  toggled.add('n30');

  bench('100 nodes re-render after toggle', () => {
    renderToString(<OrgChart data={org100} expandedIds={toggled} />);
  });
});
