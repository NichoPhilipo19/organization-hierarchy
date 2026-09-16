// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeCard } from './NodeCard';
import type { OrgNode } from './types';

describe('NodeCard — avatar', () => {
  it('renders an <img> when avatarUrl is set, instead of the initials fallback', () => {
    const node: OrgNode = {
      id: 'ceo',
      parentId: null,
      name: 'Ada Lovelace',
      avatarUrl: 'https://example.com/ada.png',
    };
    const { container } = render(<NodeCard node={node} />);
    // decorative avatar (alt="") is intentionally presentation-role, not "img" —
    // querySelector is the right tool here, not an accessible-role query.
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/ada.png');
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });
});

describe('NodeCard — initials fallback', () => {
  it('derives initials from a normal two-word name', () => {
    const node: OrgNode = { id: 'ceo', parentId: null, name: 'Ada Lovelace' };
    render(<NodeCard node={node} />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('falls back to the id when name is empty', () => {
    const node: OrgNode = { id: 'n1', parentId: null, name: '' };
    render(<NodeCard node={node} />);
    expect(screen.getByText('N1')).toBeInTheDocument();
  });

  it('falls back to the id when name is whitespace-only', () => {
    const node: OrgNode = { id: 'n2', parentId: null, name: '   ' };
    render(<NodeCard node={node} />);
    expect(screen.getByText('N2')).toBeInTheDocument();
  });
});
