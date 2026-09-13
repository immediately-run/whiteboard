// @vitest-environment jsdom
// useOverlayDialog (R3-607): the dialog contract with a REAL trigger — focus
// in on open, Tab trapped at the panel's edges, Escape closing, and focus
// returned to the element that opened the dialog.
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useOverlayDialog } from './useOverlayDialog';

function Harness() {
  const [open, setOpen] = useState(false);
  const dialogRef = useOverlayDialog(open, () => setOpen(false));
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open ? (
        <div ref={dialogRef} tabIndex={-1} data-testid="panel">
          <button>First</button>
          <button>Last</button>
        </div>
      ) : null}
    </div>
  );
}

describe('useOverlayDialog (R3-607)', () => {
  it('moves focus IN to the first control when the dialog opens', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First' }));
  });

  it('traps Tab at the panel edges — forward from last wraps to first', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First' }));
  });

  it('traps Shift+Tab at the panel edges — backward from first wraps to last', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    // focus-in put us on First already.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Last' }));
  });

  it('Escape closes, and focus RETURNS to the trigger', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('never arms while closed — keys pass through untouched', () => {
    const spy = vi.fn();
    render(
      <div onKeyDown={spy}>
        <Harness />
      </div>,
    );
    // Dispatched on an element inside the React root (React 17+ delegates at
    // the root container, so a bare document dispatch would never reach it).
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open dialog' }), { key: 'Escape' });
    expect(spy).toHaveBeenCalled();
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
  });
});
