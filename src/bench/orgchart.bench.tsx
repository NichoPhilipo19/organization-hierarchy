/**
 * Benchmark NFR-1 (T-6) — jalankan dengan `npm run bench`.
 *
 * Metode: renderToString mengukur biaya render React murni (tanpa commit DOM
 * browser), buildTree diukur langsung. Angka absolut tergantung hardware;
 * yang penting orde besaran vs target NFR-1 (<100ms initial, <16ms toggle).
 */
import { bench, describe } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OrgChart } from '../lib/OrgChart';
import { buildTree, idsUpToDepth } from '../lib/buildTree';
import type { OrgNode } from '../lib/types';

/** Org sintetis: setiap node punya `branching` anak sampai total n. */
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

describe('buildTree (O(n) klaim Technical Design §1)', () => {
  bench('100 node', () => {
    buildTree(org100);
  });
  bench('1.000 node', () => {
    buildTree(org1000);
  });
  bench('10.000 node', () => {
    buildTree(org10000);
  });
});

describe('render (NFR-1: <100ms untuk 100 node ~20% expanded)', () => {
  // ~20% expanded ≈ depth 2 pada branching 4
  const { roots } = buildTree(org100);
  const partial = idsUpToDepth(roots, 2);
  const all = new Set(org100.map((n) => n.id));

  bench('100 node, ~20% expanded (skenario NFR-1)', () => {
    renderToString(<OrgChart data={org100} expandedIds={partial} />);
  });
  bench('100 node, semua expanded', () => {
    renderToString(<OrgChart data={org100} expandedIds={all} />);
  });

  const { roots: r1000 } = buildTree(org1000);
  const partial1000 = idsUpToDepth(r1000, 3);
  bench('1.000 node, depth 3 expanded', () => {
    renderToString(<OrgChart data={org1000} expandedIds={partial1000} />);
  });
});

describe('toggle path (approx <16ms): re-render setelah 1 toggle', () => {
  // Toggle = re-render dengan Set beda 1 anggota; render ulang subtree terlihat.
  const { roots } = buildTree(org100);
  const base = idsUpToDepth(roots, 2);
  const toggled = new Set(base);
  toggled.add('n30');

  bench('100 node re-render pasca toggle', () => {
    renderToString(<OrgChart data={org100} expandedIds={toggled} />);
  });
});
