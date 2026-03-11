import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { width: 64, stroke: 4, fontSize: "text-sm", labelSize: "text-[10px]", radius: 26 },
  md: { width: 96, stroke: 5, fontSize: "text-xl", labelSize: "text-xs", radius: 38 },
  lg: { width: 128, stroke: 6, fontSize: "text-2xl", labelSize: "text-sm", radius: 52 },
};

function getScoreColor(score: number): string {
  if (score >= 61) return "var(--signal-positive)";
  if (score >= 31) return "var(--signal-high)";
  return "var(--signal-critical)";
}

export default function ScoreGauge({ score, label, size = "md" }: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const cx = config.width / 2;
  const cy = config.width / 2;
  const r = config.radius;

  // 120-degree sweep arc: from 210deg to 330deg (bottom-centered opening)
  const startAngle = 210;
  const endAngle = 330;
  const sweepRange = endAngle - startAngle;
  const clampedScore = Math.max(0, Math.min(100, score));
  const fillAngle = startAngle + (clampedScore / 100) * sweepRange;

  const polarToCart = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  // SVG arcs use clockwise convention; we flip y
  const arcPoint = (angleDeg: number) => {
    const rad = ((360 - angleDeg) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start = arcPoint(startAngle);
  const end = arcPoint(endAngle);
  const fillEnd = arcPoint(fillAngle);

  const largeArcTrack = sweepRange > 180 ? 1 : 0;
  const fillSweep = fillAngle - startAngle;
  const largeArcFill = fillSweep > 180 ? 1 : 0;

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcTrack} 1 ${end.x} ${end.y}`;
  const fillPath =
    clampedScore > 0
      ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFill} 1 ${fillEnd.x} ${fillEnd.y}`
      : "";

  const color = getScoreColor(clampedScore);
  const glowId = `glow-${size}-${score}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        className="overflow-visible"
      >
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth={config.stroke}
          strokeLinecap="round"
        />

        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
          />
        )}

        {/* Glow dot at endpoint */}
        {clampedScore > 0 && (
          <circle
            cx={fillEnd.x}
            cy={fillEnd.y}
            r={config.stroke * 0.8}
            fill={color}
            filter={`url(#${glowId})`}
          />
        )}

        {/* Center score */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="central"
          className={cn(config.fontSize, "font-semibold")}
          fill="var(--text-primary)"
        >
          {clampedScore}
        </text>
      </svg>

      {label && (
        <span className={cn(config.labelSize, "text-[var(--text-tertiary)] font-medium")}>
          {label}
        </span>
      )}
    </div>
  );
}
