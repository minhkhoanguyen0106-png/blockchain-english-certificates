import React, { useEffect, useRef, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

/**
 * Interactive LUMI Mascot (Rive .riv)
 * Asset: "LUMI" by Patgrivet — CC BY 4.0 (https://rive.app/marketplace/28748-54459-lumi/)
 *
 * Note: Inside the author's .riv file, single-character artboards use stateMachine " State Machine"
 * (with a leading space), while "Lumi-Fly" uses "State Machine 1".
 * Preloads the .riv ArrayBuffer once and keeps mood layers mounted (pausing inactive ones)
 * for instant zero-flash expression switching and built-in click-bump interactivity.
 */
const MOOD_CONFIG = {
  wave: { artboard: "Lumi-Wave", stateMachine: " State Machine" },
  hey: { artboard: "Lumi-hey", stateMachine: " State Machine" },
  idle: { artboard: "Lumi-Idle", stateMachine: " State Machine" },
  happy: { artboard: "Lumi-Happy", stateMachine: " State Machine" },
  fly: { artboard: "Lumi-Fly", stateMachine: "State Machine 1" },
  success: { artboard: "Lumi-Success", stateMachine: " State Machine" },
  no: { artboard: "Lumi-No", stateMachine: " State Machine" }
};

let cachedBufferPromise = null;
function loadLumiBuffer() {
  if (!cachedBufferPromise) {
    cachedBufferPromise = fetch("/animations/lumi.riv").then((res) => {
      if (!res.ok) throw new Error("Không thể tải tệp hoạt ảnh LUMI");
      return res.arrayBuffer();
    });
  }
  return cachedBufferPromise;
}

function LumiLayer({ buffer, artboard, stateMachine, active, onCycleComplete }) {
  const activeRef = useRef(active);
  const onCycleCompleteRef = useRef(onCycleComplete);
  activeRef.current = active;
  onCycleCompleteRef.current = onCycleComplete;

  const { rive, RiveComponent } = useRive({
    buffer,
    artboard,
    stateMachine,
    autoplay: active,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    }),
    onStop: () => {
      if (activeRef.current && onCycleCompleteRef.current) onCycleCompleteRef.current();
    },
    onLoop: () => {
      if (activeRef.current && onCycleCompleteRef.current) onCycleCompleteRef.current();
    }
  });

  useEffect(() => {
    if (!rive) return;
    if (active) {
      rive.reset({ artboard, stateMachine, autoplay: true });
      rive.play();
    } else {
      rive.pause();
    }
  }, [active, rive, artboard, stateMachine]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: active ? 1 : 0,
        transform: active ? "scale(1)" : "scale(0.95)",
        transition: "opacity 0.22s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: active ? "auto" : "none"
      }}
    >
      <RiveComponent style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

const MOUNTED_MOODS = ["wave", "hey", "happy", "fly", "success", "no"];

export default function LumiMascot({ mood = "wave", size = 260, onClick, onSuccessComplete }) {
  const [buffer, setBuffer] = useState(null);
  const resolvedMood = MOOD_CONFIG[mood] ? mood : "wave";
  const activeMood = MOUNTED_MOODS.includes(resolvedMood) ? resolvedMood : "wave";

  useEffect(() => {
    let alive = true;
    loadLumiBuffer()
      .then((buf) => {
        if (alive) setBuffer(buf);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      onClick={onClick}
      aria-label="Linh vật Koheni"
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        position: "relative",
        margin: "0 auto",
        cursor: "pointer",
        userSelect: "none"
      }}
    >
      {buffer &&
        MOUNTED_MOODS.map((m) => (
          <LumiLayer
            key={m}
            buffer={buffer}
            artboard={MOOD_CONFIG[m].artboard}
            stateMachine={MOOD_CONFIG[m].stateMachine}
            active={activeMood === m}
            onCycleComplete={m === "success" ? onSuccessComplete : undefined}
          />
        ))}
    </div>
  );
}
