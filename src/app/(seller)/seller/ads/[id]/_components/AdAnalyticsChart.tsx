import { Typography } from "@/components/Typography";
import type { DailyAdStat } from "@/types";

interface AdAnalyticsChartProps {
  data: DailyAdStat[];
}

const W = 600;
const H = 160;
const PAD = 20;

export function AdAnalyticsChart({ data }: AdAnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Typography variant="body-sm" className="text-muted-foreground">
          Daily breakdown will appear here after the first 24 hours.
        </Typography>
      </div>
    );
  }

  const maxImpr = Math.max(...data.map((d) => d.impressions), 1);
  const maxClick = Math.max(...data.map((d) => d.clicks), 1);
  const stepX = (W - PAD * 2) / Math.max(1, data.length - 1);

  const imprPoints = data
    .map((d, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - (d.impressions / maxImpr) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const clickPoints = data
    .map((d, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - (d.clicks / maxClick) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <Typography variant="label-md">Last {data.length} days</Typography>
        <div className="flex items-center gap-3">
          <Legend color="bg-primary" label="Impressions" />
          <Legend color="bg-accent" label="Clicks" />
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full sm:h-40"
        aria-label="Daily impressions and clicks"
      >
        <polyline
          fill="none"
          stroke="oklch(var(--primary) / 0.25)"
          strokeWidth="2"
          points={imprPoints}
        />
        <polyline
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          points={imprPoints}
          opacity="0.85"
        />
        <polyline
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          points={clickPoints}
        />
        {data.map((d, i) => (
          <circle
            key={d.date}
            cx={PAD + i * stepX}
            cy={H - PAD - (d.impressions / maxImpr) * (H - PAD * 2)}
            r="2.5"
            fill="var(--color-primary)"
          />
        ))}
      </svg>
      <div className="flex justify-between">
        <Typography variant="caption" className="text-muted-foreground">
          {firstDate}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {lastDate}
        </Typography>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className={`size-2.5 rounded-full ${color}`} />
      <Typography variant="caption" className="text-muted-foreground">
        {label}
      </Typography>
    </div>
  );
}
