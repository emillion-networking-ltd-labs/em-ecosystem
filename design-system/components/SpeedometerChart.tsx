// SpeedometerChart — pure-SVG gauge (no chart library). Theme-aware via Tailwind stroke/fill classes
// (stroke-surface-inverse / stroke-surface-tertiary), so it adapts to the theme with no JS. The arc
// sweeps 270° from bottom-left to bottom-right; a tapered needle points to the value.
type SpeedometerSize = "sm" | "md" | "lg";

// h and cy are tuned so the 270° arc sits vertically centred in the viewBox (~6px margin top and
// bottom): the arc spans cy−R (top) to cy+R·sin135° (the bottom ends), so cy = margin + R + strokeHalf
// and h = arc height + 2·margin. The earlier values left a large empty band above the gauge.
const speedoSizes = {
  sm: {
    w: 180,
    h: 118,
    cx: 90,
    cy: 67,
    R: 55,
    progressW: 12,
    trackW: 10,
    dashR: 38,
    needleLen: 34,
    needleBase: 4,
    hub: 6,
    hubInner: 2,
    fontSize: 12,
    labelOffset: 16,
    textClass: "text-body",
  },
  md: {
    w: 230,
    h: 151,
    cx: 115,
    cy: 86,
    R: 72,
    progressW: 16,
    trackW: 14,
    dashR: 50,
    needleLen: 48,
    needleBase: 5,
    hub: 8,
    hubInner: 3,
    fontSize: 12,
    labelOffset: 20,
    textClass: "text-h3",
  },
  lg: {
    w: 260,
    h: 175,
    cx: 130,
    cy: 100,
    R: 85,
    progressW: 18,
    trackW: 16,
    dashR: 60,
    needleLen: 55,
    needleBase: 6,
    hub: 10,
    hubInner: 4,
    fontSize: 12,
    labelOffset: 22,
    textClass: "text-h1",
  },
} as const;

export default function SpeedometerChart({
  value = 78,
  size = "lg",
}: {
  value?: number;
  size?: SpeedometerSize;
}) {
  const {
    w,
    h,
    cx,
    cy,
    R,
    progressW,
    trackW,
    dashR,
    needleLen,
    needleBase,
    hub,
    hubInner,
    fontSize,
    labelOffset,
    textClass,
  } = speedoSizes[size];

  const toRad = (d: number) => (d * Math.PI) / 180;
  const ptAt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  // Arc: 135° (bottom-left) → 45° (bottom-right) clockwise through the top = 270° sweep.
  const arcStart = 135;
  const arcEnd = 45;
  const totalSweep = 270;

  const makeArc = (
    r: number,
    fromDeg: number,
    toDeg: number,
    sweepLarger180: boolean,
  ) => {
    const s = ptAt(r, fromDeg);
    const e = ptAt(r, toDeg);
    const large = sweepLarger180 ? 1 : 0;
    return `M${s.x},${s.y} A${r},${r} 0 ${large} 1 ${e.x},${e.y}`;
  };

  const progressSweep = (value / 100) * totalSweep;
  const progressEndDeg = arcStart + progressSweep;
  const normalizedEnd = progressEndDeg % 360;

  const needleTip = ptAt(needleLen, normalizedEnd);
  const perpDeg = normalizedEnd + 90;
  const bL = ptAt(needleBase, perpDeg);
  const bR = ptAt(needleBase, perpDeg + 180);

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Track — full arc */}
        <path
          d={makeArc(R, arcStart, arcEnd, true)}
          fill="none"
          strokeWidth={trackW}
          strokeLinecap="round"
          className="stroke-surface-tertiary"
        />
        {/* Progress — partial arc */}
        <path
          d={makeArc(R, arcStart, normalizedEnd, progressSweep > 180)}
          fill="none"
          strokeWidth={progressW}
          strokeLinecap="round"
          className="stroke-surface-inverse"
        />
        {/* Inner dashed arc */}
        <path
          d={makeArc(dashR, arcStart, arcEnd, true)}
          fill="none"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="stroke-content-primary/50"
        />
        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${bL.x},${bL.y} ${bR.x},${bR.y}`}
          className="fill-surface-inverse"
        />
        {/* Center hub */}
        <circle cx={cx} cy={cy} r={hub} className="fill-surface-inverse" />
        <circle cx={cx} cy={cy} r={hubInner} className="fill-surface-primary" />
        {/* Labels */}
        <text
          x={ptAt(dashR - labelOffset, arcStart).x}
          y={ptAt(dashR - labelOffset, arcStart).y + 5}
          fontSize={fontSize}
          textAnchor="middle"
          className="fill-content-tertiary"
        >
          00
        </text>
        <text
          x={ptAt(dashR - labelOffset, arcEnd).x}
          y={ptAt(dashR - labelOffset, arcEnd).y + 5}
          fontSize={fontSize}
          textAnchor="middle"
          className="fill-content-tertiary"
        >
          100
        </text>
      </svg>
      <p
        className={`${textClass} font-normal leading-none text-content-primary -mt-3`}
      >
        {value}%
      </p>
    </div>
  );
}
