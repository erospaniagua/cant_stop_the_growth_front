import { motion } from "framer-motion";

export default function BlueprintBackground() {
  const pathD = [
    "M 120 820",
    "L 380 620",
    "L 540 720",
    "L 800 450", // cross exact center
    "L 1040 340",
    "L 1220 420",
    "L 1480 120",
  ].join(" ");

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#123b74]">
      {/* Blueprint grid (two layers => two positions) */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)",
          backgroundSize: "40px 40px, 40px 40px",
        }}
        animate={{
          backgroundPosition: ["0px 0px, 0px 0px", "160px 160px, 160px 160px"],
        }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      />

      {/* Subtle parallax pan */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, 120, 240, 120, 0],
          y: [0, -90, -180, -90, 0],
          scale: [1, 1.04, 1.08, 1.04, 1],
        }}
        transition={{ duration: 30, ease: "easeInOut", repeat: Infinity }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Triangle arrowhead that follows the path end */}
            <marker
              id="red-tip"
              markerWidth="18"
              markerHeight="18"
              refX="12"
              refY="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0,0 12,6 0,12" fill="#E00000" />
            </marker>

            {/* MASK: a white stroke that animates dash-offset to reveal the red stroke */}
            <mask id="reveal-mask">
              <rect width="100%" height="100%" fill="black" />
              <motion.path
                d={pathD}
                fill="none"
                stroke="white"
                strokeWidth="48"       // a tad thicker than the red stroke
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}          // normalize to 0..1 so no measuring needed
                initial={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                animate={{ strokeDasharray: 1, strokeDashoffset: 0 }}
                transition={{
                  duration: 4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            </mask>
          </defs>

          {/* The actual red path with marker; fully drawn but REVEALED by the mask */}
          <g mask="url(#reveal-mask)">
            <path
              d={pathD}
              fill="none"
              stroke="#E00000"
              strokeWidth="42"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#red-tip)"
            />
          </g>
        </svg>
      </motion.div>

      {/* Depth vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0b2a57]/60 pointer-events-none" />
    </div>
  );
}
