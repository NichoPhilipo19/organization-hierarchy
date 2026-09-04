/**
 * Export chart ke PNG (FR-12). `html-to-image` di-dynamic-import supaya
 * konsumen yang tidak pernah memanggil exportToPng tidak menanggung cost
 * bundle-nya — lihat TECHNICAL_DESIGN.md §Export.
 */
export async function exportChartToPng(
  target: HTMLElement | null,
  filename: string,
): Promise<void> {
  if (!target) {
    throw new Error(
      'OrgChart.exportToPng: chart is not mounted (empty data or ref not attached yet).',
    );
  }
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(target, { pixelRatio: 2 });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
