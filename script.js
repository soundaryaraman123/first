// ---------------------------------------------------------------------------
// Flower: 8 fixed ring "slots" (N, NE, E, SE, S, SW, W, NW) on a 7x7 pixel
// grid. Petals only ever occupy these slots. On hover they rotate around
// the ring (sliding slot-to-slot via CSS transition); on mouse-leave they
// ease back to the idle arrangement. They never appear outside the ring.
// ---------------------------------------------------------------------------

const CELL = 12;
const SLOT_ORDER = [
  { name: "N", row: 0, col: 3 },
  { name: "NE", row: 1, col: 5 },
  { name: "E", row: 3, col: 6 },
  { name: "SE", row: 5, col: 5 },
  { name: "S", row: 6, col: 3 },
  { name: "SW", row: 5, col: 1 },
  { name: "W", row: 3, col: 0 },
  { name: "NW", row: 1, col: 1 },
];

const CORE_YELLOW = [[2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [4, 4]];
const CORE_PURPLE = [
  [1, 2], [1, 3], [1, 4],
  [5, 2], [5, 3], [5, 4],
  [2, 1], [3, 1], [4, 1],
  [2, 5], [3, 5], [4, 5],
];

// Every flower keeps at least one empty ring slot, so hovering always
// produces a visible "chase" of pink squares around the perimeter —
// a ring with all 8 slots filled would rotate with no visible change.
const FLOWER_CONFIGS = [
  { left: "10%", top: "12%", scale: 1.15, core: "yellow-purple", active: [0, 1, 2, 4, 5, 6, 7] },
  { left: "33%", top: "30%", scale: 0.8, core: "yellow-only", active: [0, 2, 4, 6] },
  { left: "72%", top: "8%", scale: 1.3, core: "yellow-purple", active: [0, 1, 2, 4, 5, 6, 7] },
  { left: "55%", top: "42%", scale: 1.05, core: "yellow-purple", active: [0, 1, 3, 4, 5, 6, 7] },
  { left: "6%", top: "62%", scale: 1.0, core: "outline", active: [0, 1, 2, 3, 4, 6, 7] },
];

function cellPos(row, col) {
  return { left: col * CELL + "px", top: row * CELL + "px" };
}

function buildFlower(config) {
  const el = document.createElement("div");
  el.className = "flower" + (config.core === "outline" ? " flower--outline" : "");
  el.style.left = config.left;
  el.style.top = config.top;
  el.style.width = 7 * CELL + "px";
  el.style.height = 7 * CELL + "px";
  el.style.transform = `scale(${config.scale})`;

  const core = document.createElement("div");
  core.className = "flower__core";

  if (config.core !== "outline") {
    CORE_YELLOW.forEach(([r, c]) => {
      const px = document.createElement("div");
      px.className = "px px--yellow";
      Object.assign(px.style, cellPos(r, c));
      core.appendChild(px);
    });
    if (config.core === "yellow-purple") {
      CORE_PURPLE.forEach(([r, c]) => {
        const px = document.createElement("div");
        px.className = "px px--purple";
        Object.assign(px.style, cellPos(r, c));
        core.appendChild(px);
      });
    }
  } else {
    // Outline flower: draw the yellow footprint as an unfilled border only.
    CORE_YELLOW.forEach(([r, c]) => {
      const px = document.createElement("div");
      px.className = "px px--yellow";
      px.style.background = "transparent";
      px.style.border = "2px solid var(--pink-outline)";
      Object.assign(px.style, cellPos(r, c));
      core.appendChild(px);
    });
  }

  el.appendChild(core);

  // Petals: one element per active slot, each tracking its own current
  // ring position so it can rotate on hover.
  const petals = config.active.map((slotIndex) => {
    const petal = document.createElement("div");
    petal.className = "petal";
    const { row, col } = SLOT_ORDER[slotIndex];
    Object.assign(petal.style, cellPos(row, col));
    el.appendChild(petal);
    return { el: petal, slot: slotIndex };
  });

  let rotateTimer = null;

  function applyPositions() {
    petals.forEach((p) => {
      const { row, col } = SLOT_ORDER[p.slot];
      Object.assign(p.el.style, cellPos(row, col));
    });
  }

  el.addEventListener("mouseenter", () => {
    if (rotateTimer) return;
    rotateTimer = setInterval(() => {
      petals.forEach((p) => { p.slot = (p.slot + 1) % 8; });
      applyPositions();
    }, 170);
  });

  el.addEventListener("mouseleave", () => {
    clearInterval(rotateTimer);
    rotateTimer = null;
    petals.forEach((p, i) => { p.slot = config.active[i]; });
    applyPositions();
  });

  return el;
}

// ---------------------------------------------------------------------------
// Bot: eyes look around within the body, and blink on their own timer.
// ---------------------------------------------------------------------------

function buildBot() {
  const bot = document.createElement("div");
  bot.className = "bot";
  bot.innerHTML = `
    <div class="bot__roof"></div>
    <div class="bot__body"></div>
    <div class="bot__leg bot__leg--l"></div>
    <div class="bot__leg bot__leg--r"></div>
    <div class="bot__eye bot__eye--l"></div>
    <div class="bot__eye bot__eye--r"></div>
  `;

  const eyes = bot.querySelectorAll(".bot__eye");

  function look() {
    const dx = (Math.random() * 6 - 3).toFixed(1);
    const dy = (Math.random() * 3 - 1.5).toFixed(1);
    eyes.forEach((eye) => { eye.style.transform = `translate(${dx}px, ${dy}px)`; });
    setTimeout(look, 2000 + Math.random() * 1800);
  }

  function blink() {
    eyes.forEach((eye) => eye.classList.add("blink"));
    setTimeout(() => eyes.forEach((eye) => eye.classList.remove("blink")), 110);
    setTimeout(blink, 3000 + Math.random() * 3000);
  }

  setTimeout(look, 600 + Math.random() * 800);
  setTimeout(blink, 1500 + Math.random() * 2000);

  return bot;
}

function buildCursor() {
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.innerHTML = `
    <div class="cursor__arrow"></div>
    <div class="cursor__label"><div class="cursor__line"></div></div>
  `;
  return cursor;
}

// ---------------------------------------------------------------------------
// Agents (bot + cursor labels) teleport between anchor points scattered
// across the illustration: fade out, jump, fade back in.
// ---------------------------------------------------------------------------

const ANCHORS = [
  { x: "20%", y: "48%" }, { x: "38%", y: "58%" }, { x: "62%", y: "36%" },
  { x: "80%", y: "58%" }, { x: "15%", y: "78%" }, { x: "48%", y: "78%" },
  { x: "70%", y: "75%" }, { x: "30%", y: "18%" }, { x: "85%", y: "32%" },
  { x: "55%", y: "65%" },
];

function placeAt(el, anchor) {
  el.style.left = anchor.x;
  el.style.top = anchor.y;
}

function startTeleporting(el, initialAnchorIndex) {
  let current = initialAnchorIndex;
  placeAt(el, ANCHORS[current]);

  function cycle() {
    el.style.opacity = "0";
    setTimeout(() => {
      let next = current;
      while (next === current) next = Math.floor(Math.random() * ANCHORS.length);
      current = next;
      placeAt(el, ANCHORS[current]);
      el.style.opacity = "1";
    }, 420);
    setTimeout(cycle, 3200 + Math.random() * 2600);
  }

  setTimeout(cycle, 1000 + Math.random() * 2000);
}

// ---------------------------------------------------------------------------
// Wire it all up.
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const flowerLayer = document.querySelector(".flowers");
  FLOWER_CONFIGS.forEach((config) => flowerLayer.appendChild(buildFlower(config)));

  const agentLayer = document.querySelector(".agents");
  const bot = buildBot();
  const cursorA = buildCursor();
  const cursorB = buildCursor();
  agentLayer.append(bot, cursorA, cursorB);

  startTeleporting(bot, 0);
  startTeleporting(cursorA, 3);
  startTeleporting(cursorB, 6);
});
