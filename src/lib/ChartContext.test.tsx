// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChartContext } from './ChartContext';

function Probe() {
  useChartContext();
  return null;
}

describe('useChartContext', () => {
  it('throws the documented error when used outside <OrgChart>', () => {
    // React logs the thrown error to the console during render; suppress that
    // noise since the throw itself is what this test asserts.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'OrgChart internals must be rendered inside <OrgChart>',
    );
    spy.mockRestore();
  });
});
