import type { NestedOrgNode, OrgNode } from './types';

/**
 * Konversi data nested (bentuk umum dari beberapa API) → flat array
 * yang diterima <OrgChart>. One-way, tidak memutasi input.
 * `parentId` diturunkan dari posisi dalam struktur; field `children` dibuang.
 */
export function fromNested(input: NestedOrgNode | NestedOrgNode[]): OrgNode[] {
  const rootsIn = Array.isArray(input) ? input : [input];
  const out: OrgNode[] = [];

  // stack LIFO → isi terbalik supaya urutan input terjaga saat pop
  const stack: Array<[NestedOrgNode, string | null]> = [...rootsIn]
    .reverse()
    .map((r) => [r, null]);
  while (stack.length > 0) {
    const [nested, parentId] = stack.pop()!;
    const { children, ...rest } = nested;
    out.push({ ...rest, parentId });
    if (children) {
      // push terbalik supaya urutan anak terjaga saat pop
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push([children[i]!, nested.id]);
      }
    }
  }
  return out;
}

/**
 * Id semua ancestor dari `id` (parent → ... → root), dihitung dari data flat.
 * Berguna untuk auto-expand path ke node hasil search:
 * `expandedIds = new Set([...expanded, ...ancestorsOf(data, targetId)])`.
 * Cycle-safe; id tidak dikenal → array kosong.
 */
export function ancestorsOf(nodes: OrgNode[], id: string): string[] {
  const parentOf = new Map<string, string | null>();
  for (const n of nodes) {
    if (!parentOf.has(n.id)) parentOf.set(n.id, n.parentId); // first-wins, konsisten buildTree
  }

  const ancestors: string[] = [];
  const seen = new Set<string>([id]);
  let current = parentOf.get(id);
  while (current != null && parentOf.has(current) && !seen.has(current)) {
    ancestors.push(current);
    seen.add(current);
    current = parentOf.get(current) ?? null;
  }
  return ancestors;
}
