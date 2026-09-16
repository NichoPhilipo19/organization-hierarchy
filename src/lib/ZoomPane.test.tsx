// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { OrgChart } from './OrgChart';
import type { OrgNode } from './types';

// jsdom doesn't implement the Pointer Capture API yet — minimal stub so
// ZoomPane.onPointerDown (which calls setPointerCapture) doesn't throw.
beforeAll(() => {
  Object.assign(Element.prototype, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    hasPointerCapture: () => false,
  });
});

const data: OrgNode[] = [
  { id: 'ceo', parentId: null, name: 'Cee O', title: 'CEO' },
  { id: 'cto', parentId: 'ceo', name: 'Tee O', title: 'CTO' },
];

const getCanvas = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[class*="zoomCanvas"]')!;
const getViewport = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[class*="zoomViewport"]')!;

const parseTransform = (transform: string) => {
  const m = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([-\d.]+)\)/);
  if (!m) throw new Error(`unexpected transform string: ${transform}`);
  return { x: Number(m[1]), y: Number(m[2]), k: Number(m[3]) };
};

describe('ZoomPane — controls (zoomable prop)', () => {
  it('renders Zoom in / Zoom out / Reset zoom only when zoomable=true', () => {
    const { rerender } = render(<OrgChart data={data} zoomable />);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeInTheDocument();

    rerender(<OrgChart data={data} />);
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
  });

  it('Zoom in scales the canvas transform up', async () => {
    const user = userEvent.setup();
    const { container } = render(<OrgChart data={data} zoomable />);
    const canvas = getCanvas(container);
    expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1)');

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1.25)');
  });

  it('Reset zoom restores the initial transform', async () => {
    const user = userEvent.setup();
    const { container } = render(<OrgChart data={data} zoomable />);
    const canvas = getCanvas(container);

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(canvas.style.transform).not.toBe('translate(0px, 0px) scale(1)');

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});

describe('ZoomPane — wheel to zoom', () => {
  it('keeps the point under the cursor fixed (zoom-to-cursor invariant)', () => {
    const { container } = render(<OrgChart data={data} zoomable />);
    const viewport = getViewport(container);
    const canvas = getCanvas(container);
    const rect = viewport.getBoundingClientRect();
    const clientX = 120;
    const clientY = 80;

    const before = parseTransform(canvas.style.transform);
    fireEvent.wheel(viewport, { deltaY: -200, clientX, clientY });
    const after = parseTransform(canvas.style.transform);

    // It actually zoomed — otherwise the invariant check below would be vacuous.
    expect(after.k).not.toBe(before.k);

    const px = clientX - rect.left;
    const py = clientY - rect.top;
    // The canvas-space point under the cursor must map to the same place
    // before and after — that's the whole point of zoom-to-cursor (see the
    // comment in ZoomPane.tsx's wheel handler).
    expect((px - after.x) / after.k).toBeCloseTo((px - before.x) / before.k, 5);
    expect((py - after.y) / after.k).toBeCloseTo((py - before.y) / before.k, 5);
  });

  it('scrolling down (positive deltaY) zooms out', () => {
    const { container } = render(<OrgChart data={data} zoomable />);
    const viewport = getViewport(container);
    const canvas = getCanvas(container);

    fireEvent.wheel(viewport, { deltaY: 200, clientX: 0, clientY: 0 });
    expect(parseTransform(canvas.style.transform).k).toBeLessThan(1);
  });

  it('respects the same min/max clamp as the +/- buttons', () => {
    const { container } = render(<OrgChart data={data} zoomable />);
    const viewport = getViewport(container);
    const canvas = getCanvas(container);

    // MIN_SCALE/MAX_SCALE in ZoomPane.tsx are 0.25 / 2.5 — not exported, so
    // this test pins the observable behavior rather than importing them.
    fireEvent.wheel(viewport, { deltaY: -1_000_000, clientX: 0, clientY: 0 });
    expect(parseTransform(canvas.style.transform).k).toBe(2.5);

    fireEvent.wheel(viewport, { deltaY: 1_000_000, clientX: 0, clientY: 0 });
    expect(parseTransform(canvas.style.transform).k).toBe(0.25);
  });
});

describe('ZoomPane — drag to pan (regression: onClickCapture vs onNodeClick)', () => {
  it('panning via pointer drag updates the transform', () => {
    const { container } = render(<OrgChart data={data} zoomable />);
    const viewport = getViewport(container);
    const canvas = getCanvas(container);

    fireEvent.pointerDown(viewport, { clientX: 100, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(viewport, { clientX: 150, clientY: 100, pointerId: 1 }); // dx=50 > threshold 4px
    fireEvent.pointerUp(viewport, { clientX: 150, clientY: 100, pointerId: 1 });

    expect(canvas.style.transform).toBe('translate(50px, 0px) scale(1)');
  });

  it('a drag that passes over a node does NOT fire onNodeClick on it', () => {
    const onNodeClick = vi.fn();
    const { container } = render(<OrgChart data={data} zoomable onNodeClick={onNodeClick} />);
    const viewport = getViewport(container);

    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1, button: 0 });
    fireEvent.pointerMove(viewport, { clientX: 40, clientY: 0, pointerId: 1 }); // dx=40 > threshold
    fireEvent.pointerUp(viewport, { clientX: 40, clientY: 0, pointerId: 1 });
    // The browser sends a click following pointerup after a drag — onClickCapture
    // in ZoomPane must suppress it before it reaches the onNodeClick handler on the card.
    fireEvent.click(screen.getByText('Tee O'));

    expect(onNodeClick).not.toHaveBeenCalled();
  });

  it('a plain click (no movement past threshold) still fires onNodeClick', () => {
    const onNodeClick = vi.fn();
    render(<OrgChart data={data} zoomable onNodeClick={onNodeClick} />);

    fireEvent.click(screen.getByText('Tee O'));

    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'cto' }));
  });
});
