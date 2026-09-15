import type { NestedOrgNode, OrgNode } from './types';

/**
 * Converts nested data (a shape commonly returned by some APIs) → the flat array
 * accepted by <OrgChart>. One-way, does not mutate the input.
 * `parentId` is derived from position in the structure; the `children` field is dropped.
 */
export function fromNested(input: NestedOrgNode | NestedOrgNode[]): OrgNode[] {
  const rootsIn = Array.isArray(input) ? input : [input];
  const out: OrgNode[] = [];

  // LIFO stack → pushed in reverse so input order is preserved on pop
  const stack: Array<[NestedOrgNode, string | null]> = [...rootsIn].reverse().map((r) => [r, null]);
  while (stack.length > 0) {
    const [nested, parentId] = stack.pop()!;
    const { children, ...rest } = nested;
    out.push({ ...rest, parentId });
    if (children) {
      // pushed in reverse so child order is preserved on pop
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push([children[i]!, nested.id]);
      }
    }
  }
  return out;
}

/**
 * Ids of every ancestor of `id` (parent → ... → root), computed from flat data.
 * Useful for auto-expanding the path to a search-result node:
 * `expandedIds = new Set([...expanded, ...ancestorsOf(data, targetId)])`.
 * Cycle-safe; unknown id → empty array.
 */
export function ancestorsOf(nodes: OrgNode[], id: string): string[] {
  const parentOf = new Map<string, string | null>();
  for (const n of nodes) {
    if (!parentOf.has(n.id)) parentOf.set(n.id, n.parentId); // first-wins, consistent with buildTree
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
