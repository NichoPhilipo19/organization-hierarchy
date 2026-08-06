// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgChart } from './OrgChart';
import type { OrgChartHandle, OrgNode } from './types';

const data: OrgNode[] = [
  { id: 'ceo', parentId: null, name: 'Cee O', title: 'CEO' },
  { id: 'cto', parentId: 'ceo', name: 'Tee O', title: 'CTO' },
  { id: 'cfo', parentId: 'ceo', name: 'Ef O', title: 'CFO' },
  { id: 'eng1', parentId: 'cto', name: 'Eng One' },
  { id: 'eng2', parentId: 'cto', name: 'Eng Two' },
];

const item = (name: string) =>
  screen.getByText(name).closest('[role="treeitem"]') as HTMLElement;

describe('OrgChart — uncontrolled toggle (FR-3/4/5/10)', () => {
  it('renders default depth 1: roots expanded, grandchildren hidden', () => {
    render(<OrgChart data={data} />);
    expect(screen.getByText('Cee O')).toBeInTheDocument();
    expect(screen.getByText('Tee O')).toBeInTheDocument();
    // Subtree collapsed tidak di DOM sama sekali (FR-10)
    expect(screen.queryByText('Eng One')).not.toBeInTheDocument();
  });

  it('shows child count badge when collapsed, expands on toggle click (FR-5)', async () => {
    const user = userEvent.setup();
    render(<OrgChart data={data} />);
    const toggleCto = screen.getByRole('button', {
      name: /expand 2 direct reports of tee o/i,
    });
    expect(toggleCto).toHaveTextContent('2'); // badge count
    await user.click(toggleCto);
    expect(screen.getByText('Eng One')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /collapse 2 direct reports of tee o/i }),
    ).toBeInTheDocument();
    // collapse lagi
    await user.click(
      screen.getByRole('button', { name: /collapse 2 direct reports of tee o/i }),
    );
    expect(screen.queryByText('Eng One')).not.toBeInTheDocument();
  });
});

describe('OrgChart — controlled mode (FR-6)', () => {
  it('follows expandedIds prop and reports intent via onExpandedChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <OrgChart data={data} expandedIds={new Set()} onExpandedChange={onChange} />,
    );
    // Semua collapsed
    expect(screen.queryByText('Tee O')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /expand 2 direct reports of cee o/i }),
    );
    expect(onChange).toHaveBeenCalledWith(new Set(['ceo']));
    // DOM tidak berubah sampai prop di-update (controlled sejati)
    expect(screen.queryByText('Tee O')).not.toBeInTheDocument();

    rerender(
      <OrgChart
        data={data}
        expandedIds={new Set(['ceo'])}
        onExpandedChange={onChange}
      />,
    );
    expect(screen.getByText('Tee O')).toBeInTheDocument();
  });
});

describe('OrgChart — renderNode (FR-8)', () => {
  it('passes node and full state to renderNode override', () => {
    render(
      <OrgChart
        data={data}
        highlightedIds={new Set(['cto'])}
        renderNode={(node, state) => (
          <div data-testid={`custom-${node.id}`}>
            {node.name}|children:{state.childCount}|depth:{state.depth}|hl:
            {String(state.isHighlighted)}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId('custom-cto')).toHaveTextContent(
      'Tee O|children:2|depth:1|hl:true',
    );
    expect(screen.getByTestId('custom-cfo')).toHaveTextContent('hl:false');
  });
});

describe('OrgChart — onNodeClick terpisah dari toggle (FR-4)', () => {
  it('fires on card click but NOT on toggle click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OrgChart data={data} onNodeClick={onClick} />);

    await user.click(screen.getByText('Tee O'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'cto' }));

    await user.click(
      screen.getByRole('button', { name: /expand 2 direct reports/i }),
    );
    expect(onClick).toHaveBeenCalledTimes(1); // tidak bertambah
  });
});

describe('OrgChart — onDataError (FR-7, regresi T-2)', () => {
  const dirty: OrgNode[] = [
    { id: 'ceo', parentId: null, name: 'Cee O' },
    { id: 'lost', parentId: 'ghost', name: 'Lost' },
  ];

  it('reports errors once, even with inline callback across re-renders', async () => {
    const calls: unknown[] = [];
    function Harness() {
      const [tick, setTick] = useState(0);
      return (
        <div>
          <button onClick={() => setTick(tick + 1)}>rerender {tick}</button>
          {/* callback inline — identitas berubah setiap render (pola paling umum) */}
          <OrgChart data={dirty} onDataError={(errs) => calls.push(errs)} />
        </div>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    expect(calls).toHaveLength(1);

    await user.click(screen.getByText(/rerender/));
    await user.click(screen.getByText(/rerender/));
    expect(calls).toHaveLength(1); // T-2: tidak re-fire
  });
});

describe('OrgChart — data berubah (T-4)', () => {
  it('re-applies defaultExpandedDepth when data identity changes (uncontrolled)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<OrgChart data={data} />);
    // Collapse root dulu supaya state internal ≠ default
    await user.click(
      screen.getByRole('button', { name: /collapse 2 direct reports of cee o/i }),
    );
    expect(screen.queryByText('Tee O')).not.toBeInTheDocument();

    const dataB: OrgNode[] = [
      { id: 'boss', parentId: null, name: 'New Boss' },
      { id: 'aide', parentId: 'boss', name: 'New Aide' },
      { id: 'intern', parentId: 'aide', name: 'New Intern' },
    ];
    rerender(<OrgChart data={dataB} />);
    // defaultExpandedDepth=1 diterapkan ulang: root terbuka, cucu tertutup
    expect(screen.getByText('New Aide')).toBeInTheDocument();
    expect(screen.queryByText('New Intern')).not.toBeInTheDocument();
  });
});

describe('OrgChart — imperative handle (US-10)', () => {
  it('expandAll / collapseAll via ref', () => {
    const ref = createRef<OrgChartHandle>();
    render(<OrgChart ref={ref} data={data} />);
    expect(screen.queryByText('Eng One')).not.toBeInTheDocument();

    act(() => ref.current!.expandAll());
    expect(screen.getByText('Eng One')).toBeInTheDocument();
    expect(screen.getByText('Eng Two')).toBeInTheDocument();

    act(() => ref.current!.collapseAll());
    expect(screen.queryByText('Tee O')).not.toBeInTheDocument();
  });
});

describe('OrgChart — keyboard navigation (US-11, WAI-ARIA tree)', () => {
  it('supports roving tabindex + arrow keys', async () => {
    const user = userEvent.setup();
    render(<OrgChart data={data} />);

    await user.tab(); // masuk ke tree → treeitem pertama
    expect(item('Cee O')).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(item('Tee O')).toHaveFocus();

    await user.keyboard('{ArrowRight}'); // collapsed → expand
    expect(screen.getByText('Eng One')).toBeInTheDocument();
    expect(item('Tee O')).toHaveFocus();

    await user.keyboard('{ArrowRight}'); // expanded → first child
    expect(item('Eng One')).toHaveFocus();

    await user.keyboard('{ArrowLeft}'); // leaf → parent
    expect(item('Tee O')).toHaveFocus();

    await user.keyboard('{ArrowLeft}'); // open → collapse
    expect(screen.queryByText('Eng One')).not.toBeInTheDocument();

    await user.keyboard('{End}');
    expect(item('Ef O')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Cee O')).toHaveFocus();
  });

  it('Enter activates onNodeClick from keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OrgChart data={data} onNodeClick={onClick} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'ceo' }));
  });

  it('exposes aria-level / aria-setsize / aria-posinset', () => {
    render(<OrgChart data={data} />);
    const cto = item('Tee O');
    expect(cto).toHaveAttribute('aria-level', '2');
    expect(cto).toHaveAttribute('aria-setsize', '2');
    expect(cto).toHaveAttribute('aria-posinset', '1');
  });
});

describe('OrgChart — highlight (search)', () => {
  it('marks highlighted nodes with aria-selected', () => {
    render(<OrgChart data={data} highlightedIds={new Set(['cfo'])} />);
    expect(item('Ef O')).toHaveAttribute('aria-selected', 'true');
    expect(item('Tee O')).not.toHaveAttribute('aria-selected');
  });
});

describe('OrgChart — empty state', () => {
  it('renders custom emptyState', () => {
    render(<OrgChart data={[]} emptyState={<p>Kosong melompong</p>} />);
    expect(screen.getByText('Kosong melompong')).toBeInTheDocument();
  });
});
