/**
 * Shared pointer state. Listeners live on window (the canvas itself has
 * pointer-events: none so page scrolling and touch panning stay native).
 */
import * as THREE from 'three';

export const pointer = {
  /** normalised device coords, -1..1 */
  ndc: new THREE.Vector2(0, 0),
  /** CSS px */
  clientX: 0,
  clientY: 0,
  /** true when the last input was touch */
  touch: false,
  /** pointer is over an interactive DOM element (button, panel) rather than the scene */
  overUi: false,
  /** has moved since last frame */
  moved: false,
  inside: false,
};

const UI_SELECTOR = 'button, a, input, [role="slider"], dialog, [data-ui-panel], label, select, textarea';

export function isUiTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(UI_SELECTOR);
}

function onMove(e: PointerEvent) {
  pointer.clientX = e.clientX;
  pointer.clientY = e.clientY;
  pointer.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  pointer.touch = e.pointerType === 'touch';
  pointer.overUi = isUiTarget(e.target);
  pointer.moved = true;
  pointer.inside = true;
}

function onLeave() {
  pointer.inside = false;
  pointer.moved = true;
}

let installed = false;
export function installPointer() {
  if (installed) return;
  installed = true;
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
}
