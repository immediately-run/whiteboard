// React context carrying the single `useWhiteboard` instance to every chrome and
// canvas component, so they read state and call actions without prop-drilling.
// The provider is `<Whiteboard>`; consumers use the `useWb` hook.

import { createContext } from 'react';
import type { useWhiteboard } from '../hooks/useWhiteboard';

export type WhiteboardApi = ReturnType<typeof useWhiteboard>;

export const WhiteboardContext = createContext<WhiteboardApi | null>(null);
