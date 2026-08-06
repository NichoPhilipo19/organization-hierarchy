import { describe, expect, it } from 'vitest';
import { buildTree, idsUpToDepth } from './buildTree';
import type { OrgNode } from './types';

const n = (id: string, parentId: string | null): OrgNode => ({
  id,
  parentId,
  name: `Name ${id}`,
});

describe('buildTree', () => {
  it('builds a simple tree with correct depths', () => {
    const { roots, errors } = buildTree([
      n('ceo', null),
      n('cto', 'ceo'),
      n('cfo', 'ceo'),
      n('eng1', 'cto'),
    ]);
    expect(errors).toEqual([]);
    expect(roots).toHaveLength(1);
    expect(roots[0]!.node.id).toBe('ceo');
    expect(roots[0]!.depth).toBe(0);
    expect(roots[0]!.children.map((c) => c.node.id)).toEqual(['cto', 'cfo']);
    const cto = roots[0]!.children[0]!;
    expect(cto.depth).toBe(1);
    expect(cto.children[0]!.node.id).toBe('eng1');
    expect(cto.children[0]!.depth).toBe(2);
  });

  it('supports multiple roots (multi-company, FR-2)', () => {
    const { roots, errors } = buildTree([
      n('companyA', null),
      n('companyB', null),
      n('a1', 'companyA'),
      n('b1', 'companyB'),
    ]);
    expect(errors).toEqual([]);
    expect(roots.map((r) => r.node.id)).toEqual(['companyA', 'companyB']);
  });

  it('promotes orphans to roots and reports them (FR-7)', () => {
    const { roots, errors } = buildTree([n('ceo', null), n('lost', 'ghost')]);
    expect(roots.map((r) => r.node.id)).toEqual(['ceo', 'lost']);
    expect(errors).toEqual([
      expect.objectContaining({ type: 'orphan', nodeId: 'lost' }),
    ]);
  });

  it('keeps first occurrence on duplicate ids (FR-7)', () => {
    const { roots, errors } = buildTree([
      n('ceo', null),
      { id: 'x', parentId: 'ceo', name: 'First' },
      { id: 'x', parentId: 'ceo', name: 'Second' },
    ]);
    expect(errors).toEqual([
      expect.objectContaining({ type: 'duplicate', nodeId: 'x' }),
    ]);
    expect(roots[0]!.children).toHaveLength(1);
    expect(roots[0]!.children[0]!.node.name).toBe('First');
  });

  it('breaks two-node cycles and keeps every node renderable (FR-7)', () => {
    const { roots, errors } = buildTree([
      n('ceo', null),
      n('a', 'b'),
      n('b', 'a'),
    ]);
    expect(errors.some((e) => e.type === 'cycle')).toBe(true);
    // Semua node tetap ter-render: total node di forest = 3
    const count = (t: (typeof roots)[number]): number =>
      1 + t.children.reduce((acc, c) => acc + count(c), 0);
    expect(roots.reduce((acc, r) => acc + count(r), 0)).toBe(3);
  });

  it('handles self-parent as cycle (FR-7)', () => {
    const { roots, errors } = buildTree([n('solo', 'solo')]);
    expect(roots.map((r) => r.node.id)).toEqual(['solo']);
    expect(errors).toEqual([
      expect.objectContaining({ type: 'cycle', nodeId: 'solo' }),
    ]);
  });

  it('handles longer cycle chains with attached subtree', () => {
    // a → b → c → a, dan d anak dari c
    const { roots, errors } = buildTree([
      n('a', 'c'),
      n('b', 'a'),
      n('c', 'b'),
      n('d', 'c'),
    ]);
    expect(errors.some((e) => e.type === 'cycle')).toBe(true);
    const ids = new Set<string>();
    const collect = (t: (typeof roots)[number]) => {
      ids.add(t.node.id);
      t.children.forEach(collect);
    };
    roots.forEach(collect);
    expect(ids).toEqual(new Set(['a', 'b', 'c', 'd']));
  });

  it('returns empty forest for empty input', () => {
    expect(buildTree([])).toEqual({ roots: [], errors: [] });
  });

  it('does not mutate input', () => {
    const input = [n('ceo', null), n('x', 'ghost')];
    const snapshot = JSON.parse(JSON.stringify(input));
    buildTree(input);
    expect(input).toEqual(snapshot);
  });
});

describe('idsUpToDepth', () => {
  const { roots } = buildTree([
    n('ceo', null),
    n('cto', 'ceo'),
    n('eng1', 'cto'),
    n('eng2', 'cto'),
  ]);

  it('depth 1 expands only roots (FR-3 default)', () => {
    expect(idsUpToDepth(roots, 1)).toEqual(new Set(['ceo']));
  });

  it('depth 2 expands roots and level-1 nodes', () => {
    expect(idsUpToDepth(roots, 2)).toEqual(new Set(['ceo', 'cto']));
  });

  it('depth 0 expands nothing', () => {
    expect(idsUpToDepth(roots, 0)).toEqual(new Set());
  });
});
