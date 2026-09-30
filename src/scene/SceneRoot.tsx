import { useEffect } from 'react';
import { useUiStore } from '../state/uiStore';

// Placeholder — replaced in milestone 2.
export default function SceneRoot() {
  useEffect(() => useUiStore.getState().set({ sceneReady: true }), []);
  return null;
}
