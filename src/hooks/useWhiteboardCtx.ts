import { useContext } from 'react';
import { WhiteboardContext } from '../lib/context';
import type { WhiteboardApi } from '../lib/context';

/** Access the whiteboard controller from any descendant of `<Whiteboard>`. */
export function useWb(): WhiteboardApi {
  const ctx = useContext(WhiteboardContext);
  if (!ctx) throw new Error('useWb must be used within <Whiteboard>');
  return ctx;
}
