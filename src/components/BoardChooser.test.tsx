// @vitest-environment jsdom
// The adoption proof (R3-607): the board chooser carries the dialog contract —
// Escape closes it and focus returns to the control that opened it.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@immediately-run/sdk/mounts', () => ({
  getMounts: () => [],
  onMountsChange: () => () => {},
  openSettings: async () => {
    throw new Error('no host transport');
  },
}));

import { useWhiteboard } from '../hooks/useWhiteboard';
import { WhiteboardContext } from '../lib/context';
import StateScreens from './StateScreens';

function Harness() {
  const wb = useWhiteboard();
  return (
    <WhiteboardContext.Provider value={wb}>
      <button onClick={() => wb.setScreen('chooser')}>Open chooser</button>
      <StateScreens />
    </WhiteboardContext.Provider>
  );
}

describe('BoardChooser adoption (R3-607)', () => {
  it('Escape closes the chooser and focus returns to the opener', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open chooser' });
    opener.focus();
    fireEvent.click(opener);
    // The chooser is up (its heading is rendered).
    expect(screen.getByText('Open a board.')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Open a board.')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });
});

// R3-648 fault injection — this commit is REVERTED by the next one. It exists so this
// PR's own check history shows the new gate going red, per the item's rule that a gate
// nobody has seen fail is a gate nobody should trust.
import { it as __faultIt, expect as __faultExpect } from 'vitest';
__faultIt('R3-648 fault injection: the CI gate must fail on a failing test', () =>
  __faultExpect(1).toBe(2),
);
