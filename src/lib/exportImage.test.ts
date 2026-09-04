// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportChartToPng } from './exportImage';

const { toPngMock } = vi.hoisted(() => ({ toPngMock: vi.fn() }));
vi.mock('html-to-image', () => ({ toPng: toPngMock }));

describe('exportChartToPng (FR-12)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toPngMock.mockReset();
  });

  it('rejects when target is not mounted, without touching html-to-image', async () => {
    await expect(exportChartToPng(null, 'x.png')).rejects.toThrow(
      /not mounted/i,
    );
    expect(toPngMock).not.toHaveBeenCalled();
  });

  it('calls toPng with the given element and triggers a download with the filename', async () => {
    toPngMock.mockResolvedValue('data:image/png;base64,abc');
    const target = document.createElement('div');
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await exportChartToPng(target, 'chart.png');

    expect(toPngMock).toHaveBeenCalledWith(target, { pixelRatio: 2 });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from html-to-image (e.g. tainted canvas)', async () => {
    toPngMock.mockRejectedValue(new Error('tainted canvas'));
    const target = document.createElement('div');
    await expect(exportChartToPng(target, 'chart.png')).rejects.toThrow(
      'tainted canvas',
    );
  });
});
