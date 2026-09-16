import type { Story } from '@ladle/react';
import { useState } from 'react';
import { dirtyData, sampleData } from '../demo/sample-data';
import type { ChartVarStyle, NodeState, OrgNode, ThemeId, TreeError } from './index';
import { OrgChart } from './OrgChart';
import { getThemeStyle, THEME_ORDER } from './themes';

/**
 * One story per state (rather than one combined demo page) — see the
 * wishlist in docs/TECHNICAL_DESIGN.md §8: each theme preset, custom renderNode,
 * dirty dataset, and zoom & pan are deliberately kept separate for easy comparison.
 */

export const Default: Story = () => <OrgChart data={sampleData} defaultExpandedDepth={2} />;

// ---- Theme picker: 9 presets from src/lib/themes.ts, selected via Ladle control ----

interface ThemePickerProps {
  theme: ThemeId;
}

export const ThemePicker: Story<ThemePickerProps> = ({ theme }) => {
  const style: ChartVarStyle = getThemeStyle(theme);
  return (
    <div style={style}>
      <OrgChart data={sampleData} defaultExpandedDepth={2} />
    </div>
  );
};
ThemePicker.args = { theme: 'default' };
ThemePicker.argTypes = {
  theme: {
    options: THEME_ORDER,
    control: { type: 'select' },
  },
};

// ---- Custom renderNode — the lib doesn't force use of the built-in card (FR-8) ----

function renderCustomNode(node: OrgNode, state: NodeState) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid #7c3aed',
        background: state.isHighlighted ? '#ede9fe' : '#ffffff',
        color: '#5b21b6',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {node.name}
      {state.hasChildren && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: '#7c3aed',
            color: '#ffffff',
            borderRadius: 999,
            padding: '1px 6px',
          }}
        >
          {state.childCount}
        </span>
      )}
    </div>
  );
}

export const CustomRenderNode: Story = () => (
  <OrgChart data={sampleData} defaultExpandedDepth={2} renderNode={renderCustomNode} />
);

// ---- Dirty dataset — orphan/cycle/duplicate are still rendered, errors reported (FR-7) ----

export const DirtyData: Story = () => {
  const [errors, setErrors] = useState<TreeError[]>([]);
  return (
    <div>
      {errors.length > 0 && (
        <ul style={{ color: '#b42318', fontSize: 13, marginBottom: 12 }}>
          {errors.map((e) => (
            <li key={`${e.type}:${e.nodeId}`}>
              [{e.type}] {e.message}
            </li>
          ))}
        </ul>
      )}
      <OrgChart data={dirtyData} onDataError={setErrors} />
    </div>
  );
};

// ---- Zoom & pan (v2) — scroll to zoom, drag to pan ----

export const ZoomAndPan: Story = () => (
  <div style={{ height: 480, border: '1px solid #eaecf0', borderRadius: 8 }}>
    <OrgChart data={sampleData} defaultExpandedDepth={3} zoomable />
  </div>
);
