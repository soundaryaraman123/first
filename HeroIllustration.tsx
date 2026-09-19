import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

// ---------------------------------------------------------------------------
// Flower: 8 fixed ring "slots" (N, NE, E, SE, S, SW, W, NW) on a 7x7 pixel
// grid. Petals only ever occupy these slots. On hover they rotate around
// the ring (sliding slot-to-slot via CSS transition); on mouse-leave they
// ease back to the idle arrangement. They never appear outside the ring.
// Every flower keeps at least one empty slot so the rotation is visible
// (a fully-filled ring looks identical before/after a rotation).
// ---------------------------------------------------------------------------

const CELL = 12

const SLOT_ORDER = [
  { row: 0, col: 3 }, // N
  { row: 1, col: 5 }, // NE
  { row: 3, col: 6 }, // E
  { row: 5, col: 5 }, // SE
  { row: 6, col: 3 }, // S
  { row: 5, col: 1 }, // SW
  { row: 3, col: 0 }, // W
  { row: 1, col: 1 }, // NW
]

const CORE_YELLOW: [number, number][] = [
  [2, 2], [2, 3], [2, 4],
  [3, 2], [3, 3], [3, 4],
  [4, 2], [4, 3], [4, 4],
]

const CORE_PURPLE: [number, number][] = [
  [1, 2], [1, 3], [1, 4],
  [5, 2], [5, 3], [5, 4],
  [2, 1], [3, 1], [4, 1],
  [2, 5], [3, 5], [4, 5],
]

type FlowerConfig = {
  left: string
  top: string
  scale: number
  core: "yellow-purple" | "yellow-only" | "outline"
  active: number[]
}

const FLOWER_CONFIGS: FlowerConfig[] = [
  { left: "10%", top: "12%", scale: 1.15, core: "yellow-purple", active: [0, 1, 2, 4, 5, 6, 7] },
  { left: "33%", top: "30%", scale: 0.8, core: "yellow-only", active: [0, 2, 4, 6] },
  { left: "72%", top: "8%", scale: 1.3, core: "yellow-purple", active: [0, 1, 2, 4, 5, 6, 7] },
  { left: "55%", top: "42%", scale: 1.05, core: "yellow-purple", active: [0, 1, 3, 4, 5, 6, 7] },
  { left: "6%", top: "62%", scale: 1.0, core: "outline", active: [0, 1, 2, 3, 4, 6, 7] },
]

const COLORS = {
  yellow: "#f5ce63",
  purple: "#c7a2cf",
  pink: "#f2aacb",
  pinkOutline: "#f6c9dc",
  green: "#c9db6f",
  panelBg: "#eef8fc",
  gridLine: "#d7ecf5",
  dark: "#333333",
}

function cellPos(row: number, col: number) {
  return { left: col * CELL, top: row * CELL }
}

function Flower({ config }: { config: FlowerConfig }) {
  const [slots, setSlots] = useState<number[]>(config.active)
  const timer = useRef<ReturnType<typeof window.setInterval> | null>(null)

  function startRotating() {
    if (timer.current) return
    timer.current = window.setInterval(() => {
      setSlots((prev) => prev.map((s) => (s + 1) % 8))
    }, 170)
  }

  function stopRotating() {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
    setSlots(config.active)
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  const size = 7 * CELL
  const outline = config.core === "outline"

  return (
    <div
      onMouseEnter={startRotating}
      onMouseLeave={stopRotating}
      style={{
        position: "absolute",
        left: config.left,
        top: config.top,
        width: size,
        height: size,
        transform: `scale(${config.scale})`,
        transformOrigin: "center",
      }}
    >
      {CORE_YELLOW.map(([r, c], i) => {
        const pos = cellPos(r, c)
        return (
          <div
            key={"y" + i}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              width: CELL,
              height: CELL,
              borderRadius: 1,
              background: outline ? "transparent" : COLORS.yellow,
              border: outline ? `2px solid ${COLORS.pinkOutline}` : "none",
            }}
          />
        )
      })}

      {config.core === "yellow-purple" &&
        CORE_PURPLE.map(([r, c], i) => {
          const pos = cellPos(r, c)
          return (
            <div
              key={"p" + i}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                width: CELL,
                height: CELL,
                borderRadius: 1,
                background: COLORS.purple,
              }}
            />
          )
        })}

      {slots.map((slot, i) => {
        const { row, col } = SLOT_ORDER[slot]
        const pos = cellPos(row, col)
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              width: CELL,
              height: CELL,
              borderRadius: 1,
              background: outline ? "transparent" : COLORS.pink,
              border: outline ? `2px solid ${COLORS.pinkOutline}` : "none",
              transition: "left 0.18s ease, top 0.18s ease",
            }}
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bot: eyes look around within the body on their own timer, and blink
// independently on another timer.
// ---------------------------------------------------------------------------

function Bot() {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let lookTimeout: ReturnType<typeof window.setTimeout>
    let blinkOpenTimeout: ReturnType<typeof window.setTimeout>
    let blinkTimeout: ReturnType<typeof window.setTimeout>

    function look() {
      const dx = Math.random() * 6 - 3
      const dy = Math.random() * 3 - 1.5
      setEyeOffset({ x: dx, y: dy })
      lookTimeout = window.setTimeout(look, 2000 + Math.random() * 1800)
    }

    function blink() {
      setBlinking(true)
      blinkOpenTimeout = window.setTimeout(() => setBlinking(false), 110)
      blinkTimeout = window.setTimeout(blink, 3000 + Math.random() * 3000)
    }

    lookTimeout = window.setTimeout(look, 600 + Math.random() * 800)
    blinkTimeout = window.setTimeout(blink, 1500 + Math.random() * 2000)

    return () => {
      clearTimeout(lookTimeout)
      clearTimeout(blinkOpenTimeout)
      clearTimeout(blinkTimeout)
    }
  }, [])

  const eyeStyle: CSSProperties = {
    position: "absolute",
    top: 8,
    width: 6,
    height: 12,
    background: "#fff",
    transition: blinking ? "transform 0.09s ease" : "transform 0.35s ease-in-out",
    transform: blinking ? "scaleY(0.12)" : `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
  }

  return (
    <div style={{ position: "relative", width: 46, height: 34 }}>
      <div style={{ position: "absolute", top: -8, left: 10, width: 26, height: 10, background: COLORS.dark, border: "2px solid #fff" }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 46, height: 26, background: COLORS.dark, border: "2px solid #fff", borderRadius: 2, boxShadow: "3px 4px 0 rgba(0,0,0,0.15)" }} />
      <div style={{ position: "absolute", bottom: -6, left: 10, width: 6, height: 8, background: COLORS.dark, border: "2px solid #fff" }} />
      <div style={{ position: "absolute", bottom: -6, left: 28, width: 6, height: 8, background: COLORS.dark, border: "2px solid #fff" }} />
      <div style={{ ...eyeStyle, left: 12 }} />
      <div style={{ ...eyeStyle, left: 26 }} />
    </div>
  )
}

function CursorLabel() {
  return (
    <div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: `11px solid ${COLORS.dark}`,
          transform: "rotate(-15deg)",
        }}
      />
      <div style={{ marginTop: 2, marginLeft: 10, background: COLORS.dark, borderRadius: 4, padding: "5px 10px", boxShadow: "2px 3px 0 rgba(0,0,0,0.12)" }}>
        <div style={{ width: 34, height: 4, background: "#cfcfcf", borderRadius: 2 }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Teleporting agents: the bot + cursor labels fade out, jump to a new
// anchor point scattered across the illustration, then fade back in —
// each on its own randomized, independent timer.
// ---------------------------------------------------------------------------

const ANCHORS = [
  { x: "20%", y: "48%" }, { x: "38%", y: "58%" }, { x: "62%", y: "36%" },
  { x: "80%", y: "58%" }, { x: "15%", y: "78%" }, { x: "48%", y: "78%" },
  { x: "70%", y: "75%" }, { x: "30%", y: "18%" }, { x: "85%", y: "32%" },
  { x: "55%", y: "65%" },
]

function useTeleport(initialIndex: number) {
  const [index, setIndex] = useState(initialIndex)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let cycleTimeout: ReturnType<typeof window.setTimeout>
    let jumpTimeout: ReturnType<typeof window.setTimeout>

    function cycle() {
      setVisible(false)
      jumpTimeout = window.setTimeout(() => {
        setIndex((prev) => {
          let next = prev
          while (next === prev) next = Math.floor(Math.random() * ANCHORS.length)
          return next
        })
        setVisible(true)
      }, 420)
      cycleTimeout = window.setTimeout(cycle, 3200 + Math.random() * 2600)
    }

    cycleTimeout = window.setTimeout(cycle, 1000 + Math.random() * 2000)
    return () => {
      clearTimeout(cycleTimeout)
      clearTimeout(jumpTimeout)
    }
  }, [])

  return { anchor: ANCHORS[index], visible }
}

function TeleportingAgent({ initialIndex, children }: { initialIndex: number; children: ReactNode }) {
  const { anchor, visible } = useTeleport(initialIndex)
  return (
    <div
      style={{
        position: "absolute",
        left: anchor.x,
        top: anchor.y,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function HeroIllustration(props: { style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 500,
        overflow: "hidden",
        background: COLORS.panelBg,
        ...props.style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${COLORS.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <svg
        viewBox="0 0 900 900"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <path d="M150,900 C150,760 230,740 210,650 C190,560 120,560 120,470" fill="none" stroke={COLORS.green} strokeWidth={16} strokeLinecap="round" />
        <path d="M330,900 C330,780 400,760 380,660 C360,570 300,560 300,420" fill="none" stroke={COLORS.green} strokeWidth={16} strokeLinecap="round" />
        <path d="M520,900 C520,770 460,740 480,640 C500,540 560,540 560,430" fill="none" stroke={COLORS.green} strokeWidth={16} strokeLinecap="round" />
        <path d="M700,900 C700,760 640,730 660,630 C680,540 740,540 740,380" fill="none" stroke={COLORS.green} strokeWidth={16} strokeLinecap="round" />
        <path d="M420,900 C440,820 500,800 470,720 C440,640 380,630 380,560" fill="none" stroke={COLORS.green} strokeWidth={16} strokeLinecap="round" />
      </svg>

      <div style={{ position: "absolute", inset: 0 }}>
        {FLOWER_CONFIGS.map((config, i) => (
          <Flower key={i} config={config} />
        ))}
      </div>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <TeleportingAgent initialIndex={0}><Bot /></TeleportingAgent>
        <TeleportingAgent initialIndex={3}><CursorLabel /></TeleportingAgent>
        <TeleportingAgent initialIndex={6}><CursorLabel /></TeleportingAgent>
      </div>
    </div>
  )
}
