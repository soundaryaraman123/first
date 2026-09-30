/**
 * Brush decal state (drawn by the terrain shader, see terrainMaterial.ts).
 * Pointer mode: follows the cursor. Touch / keyboard: flashes briefly at a point.
 */
import { terrainUniforms } from '../terrain/terrainMaterial';
import { conversion } from '../../content/conversion';

export const brush = {
  /** 0..1 target opacity while following the pointer */
  follow: 0,
  /** seconds remaining on a flash */
  flash: 0,
};

terrainUniforms.uBrushRadius.value = conversion.brushRadius;

export function flashBrush(x: number, y: number, z: number) {
  terrainUniforms.uBrushPos.value.set(x, y, z);
  brush.flash = 0.9;
}

export function updateBrush(dt: number, wantFollow: boolean) {
  brush.follow += ((wantFollow ? 1 : 0) - brush.follow) * Math.min(1, dt * 10);
  brush.flash = Math.max(0, brush.flash - dt);
  const flash = brush.flash > 0 ? Math.min(1, brush.flash / 0.3) : 0;
  terrainUniforms.uBrushOpacity.value = Math.max(brush.follow, flash);
}
