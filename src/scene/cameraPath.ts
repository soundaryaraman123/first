/**
 * CAMERA PATH — tune me.
 *
 * Keyframes are placed on the story timeline (`at`):
 *   at = sectionIndex + progressWithinSection
 *   e.g. 1.5 = halfway through section 1 ("The old forest").
 * Between keys the camera eases position, look-at target and fov.
 * Set `hold: true` on a key to make the camera settle there (ease in/out);
 * otherwise it glides through without slowing.
 *
 * World orientation (procedural terrain):
 *   -z is "into the screen": valley floor near z = 0, the forested slope
 *   rises to a ridge near z = -175, snowy peaks beyond z = -250.
 *   Heights: valley ~0, ridge ~100, peaks 200–300, sea of clouds ~190–240.
 *   Trees are ~5–10 units tall.
 *
 * Tip: open the site with ?debug to see the live storyPos.
 */
export type Vec3 = [number, number, number];

export interface CameraKey {
  at: number;
  pos: Vec3;
  target: Vec3;
  fov?: number;
  hold?: boolean;
  note?: string;
}

export const cameraPath: CameraKey[] = [
  { at: 0.0, pos: [0, 330, 430], target: [0, 250, -420], fov: 50, hold: true, note: 'Arrival: above a sea of clouds' },
  { at: 0.5, pos: [-10, 235, 300], target: [0, 150, -180], fov: 48, note: 'Dropping through the clouds' },
  { at: 1.0, pos: [-30, 105, 165], target: [-10, 40, -80], fov: 46, note: 'Below the clouds, over the valley' },
  { at: 1.35, pos: [-55, 52, 70], target: [-25, 40, -60], fov: 45, hold: true, note: 'Close on the mixed forest' },
  { at: 1.75, pos: [20, 50, 60], target: [15, 38, -60], fov: 45, hold: true },
  { at: 2.05, pos: [0, 95, 150], target: [0, 25, -40], fov: 46, note: 'The turn: wide, valley + railway' },
  { at: 2.8, pos: [30, 90, 140], target: [5, 30, -50], fov: 46, hold: true },
  { at: 3.0, pos: [0, 92, 118], target: [0, 45, -75], fov: 46, hold: true, note: 'Conversion: hold on the slope' },
  { at: 3.35, pos: [0, 92, 118], target: [0, 45, -75], fov: 46, hold: true },
  { at: 4.0, pos: [0, 140, 230], target: [0, 50, -90], fov: 44, hold: true, note: 'What changed: pull back' },
  { at: 5.0, pos: [0, 190, 300], target: [0, 140, -200], fov: 44, note: 'Rise into the sky before the 2D section' },
];

/**
 * Reduced motion: instead of scrubbing, the camera cuts to one still per
 * section (with a quick fade). Values are story positions on the path above.
 */
export const reducedMotionStills: number[] = [0.0, 1.35, 2.8, 3.0, 4.0, 5.0];

/** Max pointer parallax in world units (0 to disable). */
export const POINTER_PARALLAX = 2.5;
