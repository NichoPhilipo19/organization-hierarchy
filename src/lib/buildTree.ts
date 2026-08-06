import type { BuildTreeResult, OrgNode, TreeError, TreeNode } from './types';

/**
 * Flat array → forest. Satu pass O(n) + satu traversal untuk depth & deteksi cycle.
 *
 * Kebijakan data kotor (FR-7):
 * - duplicate id  → node pertama menang, sisanya diabaikan
 * - orphan        → dipromosikan jadi root
 * - cycle         → satu parent-link dalam cycle diputus, node jadi root
 * Semua kasus dicatat di `errors`; input tidak pernah dimutasi.
 */
export function buildTree(nodes: OrgNode[]): BuildTreeResult {
  const errors: TreeError[] = [];
  const map = new Map<string, TreeNode>();

  for (const node of nodes) {
    if (map.has(node.id)) {
      errors.push({
        type: 'duplicate',
        nodeId: node.id,
        message: `Duplicate id "${node.id}" — first occurrence kept, others ignored`,
      });
      continue;
    }
    map.set(node.id, { node, children: [], depth: 0 });
  }

  const roots: TreeNode[] = [];

  for (const tn of map.values()) {
    const { id, parentId } = tn.node;
    if (parentId === null) {
      roots.push(tn);
    } else if (parentId === id) {
      errors.push({
        type: 'cycle',
        nodeId: id,
        message: `Node "${id}" is its own parent — treated as root`,
      });
      roots.push(tn);
    } else if (!map.has(parentId)) {
      errors.push({
        type: 'orphan',
        nodeId: id,
        message: `Node "${id}" references missing parent "${parentId}" — treated as root`,
      });
      roots.push(tn);
    } else {
      map.get(parentId)!.children.push(tn);
    }
  }

  // Traversal dari roots: set depth + tandai reachable.
  const visited = new Set<string>();
  const visit = (start: TreeNode, startDepth: number) => {
    const stack: Array<[TreeNode, number]> = [[start, startDepth]];
    while (stack.length > 0) {
      const [tn, depth] = stack.pop()!;
      if (visited.has(tn.node.id)) continue;
      visited.add(tn.node.id);
      tn.depth = depth;
      for (const child of tn.children) stack.push([child, depth + 1]);
    }
  };
  for (const root of roots) visit(root, 0);

  // Node yang tidak reachable dari root mana pun pasti berada di (atau di bawah) cycle.
  for (const tn of map.values()) {
    if (visited.has(tn.node.id)) continue;

    // Naik lewat parent chain sampai ketemu node yang berulang → itu anggota cycle.
    const walked = new Set<string>();
    let member = tn;
    while (!walked.has(member.node.id)) {
      walked.add(member.node.id);
      member = map.get(member.node.parentId!)!;
    }

    // Putus parent-link anggota cycle: lepas dari children parent, promosikan jadi root.
    const parent = map.get(member.node.parentId!)!;
    const idx = parent.children.indexOf(member);
    if (idx >= 0) parent.children.splice(idx, 1);
    errors.push({
      type: 'cycle',
      nodeId: member.node.id,
      message: `Cycle detected — parent link of "${member.node.id}" removed, node treated as root`,
    });
    roots.push(member);
    visit(member, 0);
  }

  return { roots, errors };
}

/** Id semua node dengan depth < maxDepth — untuk defaultExpandedDepth. (FR-3) */
export function idsUpToDepth(roots: TreeNode[], maxDepth: number): Set<string> {
  const ids = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const tn = stack.pop()!;
    if (tn.depth < maxDepth) {
      ids.add(tn.node.id);
      stack.push(...tn.children);
    }
  }
  return ids;
}
