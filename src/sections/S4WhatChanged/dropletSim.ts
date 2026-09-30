/**
 * Section 4 droplet micro-interaction on a 2D canvas.
 *   oak side (left of the divider): drops sink into the litter and soil
 *     and feed a slowly rising water line (the spring)
 *   pine side (right): drops bead on the needle layer and run off sideways
 * Coordinates are in the illustrations' 800×400 view space.
 */
import { GROUND_Y, VIEW_H, VIEW_W } from './illustrations';

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 0 | 1 | 2; // falling, soaking, running
  t: number;
}

const WATER = '91, 135, 145';

export class DropletSim {
  drops: Drop[] = [];
  spawnAcc = 0;
  groundwater = 0; // 0..1
  constructor(private ctx: CanvasRenderingContext2D) {}

  step(dt: number, divider: number) {
    const divX = divider * VIEW_W;
    this.spawnAcc += dt * 14;
    while (this.spawnAcc > 1) {
      this.spawnAcc -= 1;
      this.drops.push({ x: Math.random() * VIEW_W, y: -10, vx: 0, vy: 180 + Math.random() * 80, state: 0, t: 0 });
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.t += dt;
      if (d.state === 0) {
        d.vy += 420 * dt;
        d.y += d.vy * dt;
        if (d.y >= GROUND_Y) {
          d.y = GROUND_Y;
          d.t = 0;
          d.state = d.x < divX ? 1 : 2;
          d.vx = 90 + Math.random() * 60;
        }
      } else if (d.state === 1) {
        d.y += 26 * dt; // soak in
        if (d.t > 2.2) {
          this.groundwater = Math.min(1, this.groundwater + 0.004);
          this.drops.splice(i, 1);
        }
      } else {
        d.x += d.vx * dt; // run off
        d.y = GROUND_Y - 2 + Math.sin(d.t * 14 + d.vx) * 0.8;
        d.vx += 60 * dt;
        if (d.x > VIEW_W + 10 || d.t > 5) this.drops.splice(i, 1);
      }
    }
    this.groundwater = Math.max(0, this.groundwater - dt * 0.012);
  }

  draw(width: number, height: number, divider: number) {
    const ctx = this.ctx;
    const s = width / VIEW_W;
    ctx.setTransform(s, 0, 0, height / VIEW_H, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    const divX = divider * VIEW_W;

    // rising water line on the oak side
    const level = VIEW_H - 14 - this.groundwater * 40;
    ctx.fillStyle = `rgba(${WATER}, 0.35)`;
    ctx.fillRect(0, level, divX, VIEW_H - level);

    for (const d of this.drops) {
      if (d.state === 0) {
        ctx.fillStyle = `rgba(${WATER}, 0.9)`;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 2.2, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.state === 1) {
        const a = Math.max(0, 1 - d.t / 2.2);
        // seep trail into the soil
        ctx.strokeStyle = `rgba(${WATER}, ${0.35 * a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x, GROUND_Y);
        ctx.lineTo(d.x + Math.sin(d.t * 3) * 3, d.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${WATER}, ${0.8 * a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.4 * a + 0.5, 0, Math.PI * 2);
        ctx.fill();
        if (d.t < 0.25) {
          ctx.strokeStyle = `rgba(${WATER}, ${1 - d.t * 4})`;
          ctx.beginPath();
          ctx.ellipse(d.x, GROUND_Y, 4 + d.t * 30, 1.5 + d.t * 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        const a = Math.max(0, 1 - d.t / 5);
        ctx.fillStyle = `rgba(${WATER}, ${0.9 * a})`;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${WATER}, ${0.3 * a})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x - 16, d.y);
        ctx.lineTo(d.x - 3, d.y);
        ctx.stroke();
      }
    }
  }

  /** Reduced motion: one still frame showing both behaviours. */
  drawStill(width: number, height: number, divider: number) {
    this.drops = [];
    for (let i = 0; i < 26; i++) {
      const x = 16 + i * 30;
      const soak = x < divider * VIEW_W;
      this.drops.push({ x, y: soak ? GROUND_Y + 10 + (i % 4) * 8 : GROUND_Y - 2, vx: 0, vy: 0, state: soak ? 1 : 2, t: soak ? 0.6 : 0.8 });
      this.drops.push({ x: x + 12, y: 40 + ((i * 37) % 170), vx: 0, vy: 0, state: 0, t: 0 });
    }
    this.groundwater = 0.6;
    this.draw(width, height, divider);
  }
}
