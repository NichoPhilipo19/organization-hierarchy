import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import s from './OrgChart.module.css';

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;

interface Transform {
  x: number;
  y: number;
  k: number;
}

const clampK = (k: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));

/**
 * Zoom & pan (Technical Design roadmap v2) — CSS transform + pointer events,
 * tanpa dependency. Scroll = zoom ke arah kursor; drag = pan; tombol overlay
 * untuk akses keyboard/touchpad.
 */
export function ZoomPane({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 });

  // Drag state di ref — tidak perlu re-render per mousemove frame
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  // Wheel handler non-passive (React memasang wheel sebagai passive)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setT((prev) => {
        const k = clampK(prev.k * Math.exp(-e.deltaY * 0.0015));
        const r = k / prev.k;
        // Titik di bawah kursor tetap di tempat (zoom-to-cursor)
        return { k, x: px - (px - prev.x) * r, y: py - (py - prev.y) * r };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const el = viewportRef.current;
    const rect = el?.getBoundingClientRect();
    const px = rect ? rect.width / 2 : 0;
    const py = rect ? rect.height / 2 : 0;
    setT((prev) => {
      const k = clampK(prev.k * factor);
      const r = k / prev.k;
      return { k, x: px - (px - prev.x) * r, y: py - (py - prev.y) * r };
    });
  };

  return (
    <div
      ref={viewportRef}
      className={s.zoomViewport}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea')) return;
        drag.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originX: t.x,
          originY: t.y,
          moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.pointerId !== e.pointerId) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) < 4) return; // threshold klik vs drag
        d.moved = true;
        setT((prev) => ({ ...prev, x: d.originX + dx, y: d.originY + dy }));
      }}
      onPointerUp={(e) => {
        if (drag.current?.pointerId === e.pointerId) {
          if (!drag.current.moved) drag.current = null;
          // kalau moved, biarkan sampai clickCapture menekan click yang menyusul
        }
      }}
      onClickCapture={(e) => {
        // Setelah drag, jangan sampai click "nyasar" memicu onNodeClick
        if (drag.current?.moved) {
          e.preventDefault();
          e.stopPropagation();
        }
        drag.current = null;
      }}
    >
      <div
        className={s.zoomCanvas}
        style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}
      >
        {children}
      </div>
      <div className={s.zoomControls}>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomBy(1 / 1.25)}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={() => setT({ x: 0, y: 0, k: 1 })}
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
