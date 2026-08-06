import { describe, expect, it } from 'vitest';
import { ancestorsOf, fromNested } from './helpers';
import type { NestedOrgNode, OrgNode } from './types';

describe('fromNested', () => {
  it('flattens a nested tree with derived parentIds, preserving order', () => {
    const nested: NestedOrgNode = {
      id: 'ceo',
      name: 'Cee O',
      children: [
        { id: 'cto', name: 'Tee O', children: [{ id: 'eng1', name: 'Eng One' }] },
        { id: 'cfo', name: 'Ef O' },
      ],
    };
    expect(fromNested(nested)).toEqual([
      { id: 'ceo', name: 'Cee O', parentId: null },
      { id: 'cto', name: 'Tee O', parentId: 'ceo' },
      { id: 'eng1', name: 'Eng One', parentId: 'cto' },
      { id: 'cfo', name: 'Ef O', parentId: 'ceo' },
    ]);
  });

  it('accepts an array of roots (multi-company)', () => {
    const flat = fromNested([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B', children: [{ id: 'b1', name: 'B1' }] },
    ]);
    expect(flat.map((n) => [n.id, n.parentId])).toEqual([
      ['a', null],
      ['b', null],
      ['b1', 'b'],
    ]);
  });

  it('preserves extra fields and drops children', () => {
    const flat = fromNested({
      id: 'x',
      name: 'X',
      title: 'Boss',
      data: { level: 1 },
      children: [],
    });
    expect(flat[0]).toEqual({
      id: 'x',
      name: 'X',
      title: 'Boss',
      data: { level: 1 },
      parentId: null,
    });
    expect('children' in flat[0]!).toBe(false);
  });

  it('does not mutate input', () => {
    const nested: NestedOrgNode = {
      id: 'a',
      name: 'A',
      children: [{ id: 'b', name: 'B' }],
    };
    const snapshot = JSON.parse(JSON.stringify(nested));
    fromNested(nested);
    expect(nested).toEqual(snapshot);
  });
});

describe('ancestorsOf', () => {
  const data: OrgNode[] = [
    { id: 'ceo', parentId: null, name: 'C' },
    { id: 'cto', parentId: 'ceo', name: 'T' },
    { id: 'eng', parentId: 'cto', name: 'E' },
  ];

  it('returns parent chain up to root', () => {
    expect(ancestorsOf(data, 'eng')).toEqual(['cto', 'ceo']);
  });

  it('returns empty for roots and unknown ids', () => {
    expect(ancestorsOf(data, 'ceo')).toEqual([]);
    expect(ancestorsOf(data, 'nope')).toEqual([]);
  });

  it('is cycle-safe', () => {
    const cyclic: OrgNode[] = [
      { id: 'a', parentId: 'b', name: 'A' },
      { id: 'b', parentId: 'a', name: 'B' },
    ];
    expect(ancestorsOf(cyclic, 'a')).toEqual(['b']);
  });
});
