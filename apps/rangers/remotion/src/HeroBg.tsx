import { useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile } from "remotion";

// Approximate lane positions in the 1920x1080 frame
const LANES = [
  { x: 240, y: 450 },
  { x: 500, y: 430 },
  { x: 760, y: 455 },
  { x: 1020, y: 435 },
  { x: 1280, y: 450 },
  { x: 1540, y: 430 },
  { x: 1760, y: 445 },
];

export const HeroBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Aggressive camera: start right of frame, pan left as if tracking a swimmer down the lane
  const scale = interpolate(frame, [0, durationInFrames], [1.08, 1.28], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(frame, [0, durationInFrames], [6, -8], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame, [0, durationInFrames], [-2, 3], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: "clamp",
  });

  // Animated pool light caustics — organic slow movement
  const causticX = 55 + Math.sin(frame * 0.035) * 15;
  const causticY = 38 + Math.cos(frame * 0.022) * 9;
  const causticOpacity = 0.07 + Math.sin(frame * 0.055) * 0.035;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "#1a2332" }}>
      {/* Base image with dynamic camera tracking movement */}
      <img
        src={staticFile("hero-bg.jpg")}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}%) translateY(${translateY}%)`,
          transformOrigin: "center center",
        }}
      />

      {/* Water ripple animations — one per lane, staggered timing */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {LANES.map((lane, i) => {
          const cycleFrames = fps * 1.15; // 1.15s per ripple
          const phaseOffset = (i / LANES.length) * cycleFrames;
          const localFrame = ((frame + phaseOffset) % cycleFrames + cycleFrames) % cycleFrames;
          const t = localFrame / cycleFrames;

          // Outer ripple
          const r1 = interpolate(t, [0, 1], [10, 120]);
          const op1 = interpolate(t, [0, 0.12, 0.75, 1], [0, 0.55, 0.18, 0]);

          // Inner ripple (slightly delayed)
          const t2 = Math.max(0, t - 0.15);
          const r2 = interpolate(t2, [0, 0.85], [8, 70]);
          const op2 = interpolate(t2, [0, 0.1, 0.7, 0.85], [0, 0.65, 0.25, 0]);

          const isEven = i % 2 === 0;
          const strokeOuter = isEven ? "255,255,255" : "91,192,235";
          const strokeInner = isEven ? "91,192,235" : "255,255,255";

          return (
            <g key={i}>
              <ellipse
                cx={lane.x}
                cy={lane.y}
                rx={r1}
                ry={r1 * 0.32}
                fill="none"
                stroke={`rgba(${strokeOuter},${op1})`}
                strokeWidth="2.5"
              />
              <ellipse
                cx={lane.x}
                cy={lane.y}
                rx={r2}
                ry={r2 * 0.32}
                fill="none"
                stroke={`rgba(${strokeInner},${op2})`}
                strokeWidth="1.8"
              />
            </g>
          );
        })}
      </svg>

      {/* Pool caustic light — slow organic shimmer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 45% 28% at ${causticX}% ${causticY}%, rgba(91,192,235,${causticOpacity}) 0%, transparent 100%)`,
        }}
      />

      {/* Second caustic for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 30% 20% at ${100 - causticX}% ${causticY + 15}%, rgba(0,95,140,${causticOpacity * 0.7}) 0%, transparent 100%)`,
        }}
      />

      {/* Left vignette — darkens text area without touching swimmers side */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(26,35,50,0.88) 0%, rgba(26,35,50,0.58) 45%, rgba(26,35,50,0.12) 100%)",
        }}
      />
      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(26,35,50,0.65) 0%, transparent 42%)",
        }}
      />
    </div>
  );
};
