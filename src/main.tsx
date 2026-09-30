import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { App } from './App';
import { useUiStore } from './state/uiStore';
import { detectReducedMotion, detectTier, detectTouch, detectWebGL } from './lib/device';

// Evaluate device capabilities once, before first render.
const reducedMotion = detectReducedMotion();
useUiStore.getState().set({
  reducedMotion,
  tier: detectTier(),
  touch: detectTouch(),
  webgl: detectWebGL(),
});
document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
