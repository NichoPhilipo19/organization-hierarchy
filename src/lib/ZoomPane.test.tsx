// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgChart } from './OrgChart';
import type { OrgNode } from './types';

// jsdom belum mengimplementasikan Pointer Capture API — stub minimal supaya
// ZoomPane.onPointerDown (yang memanggil setPointerCapture) tidak throw.
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

describe('ZoomPane — controls (zoomable prop)', () => {
  it('renders Zoom in / Zoom out / Reset zoom only when zoomable=true', () => {
    const { rerender } = render(<OrgChart data={data} zoomable />);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset zoom' }),
    ).toBeInTheDocument();

    rerender(<OrgChart data={data} />);
    expect(
      screen.queryByRole('button', { name: 'Zoom in' }),
    ).not.toBeInTheDocument();
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
    const { container } = render(
      <OrgChart data={data} zoomable onNodeClick={onNodeClick} />,
    );
    const viewport = getViewport(container);

    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1, button: 0 });
    fireEvent.pointerMove(viewport, { clientX: 40, clientY: 0, pointerId: 1 }); // dx=40 > threshold
    fireEvent.pointerUp(viewport, { clientX: 40, clientY: 0, pointerId: 1 });
    // Browser mengirim click yang menyusul pointerup setelah drag — onClickCapture
    // di ZoomPane harus menekannya sebelum sampai ke handler onNodeClick di kartu.
    fireEvent.click(screen.getByText('Tee O'));

    expect(onNodeClick).not.toHaveBeenCalled();
  });

  it('a plain click (no movement past threshold) still fires onNodeClick', () => {
    const onNodeClick = vi.fn();
    render(<OrgChart data={data} zoomable onNodeClick={onNodeClick} />);

    fireEvent.click(screen.getByText('Tee O'));

    expect(onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cto' }),
    );
  });
});
