"use client";

import type { ChannelBreakdown, ConsentTrendPoint, PurposeBreakdown } from "@consent/schemas";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

/** Recharts lives only in this module so it is split out and loaded on demand (frontend.md §14). Tokens only. */
const axis = { stroke: "var(--text-muted)", fontSize: 12 };
const grid = "var(--border)";
const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
};
const numberTick = (v: number) => formatNumber(v);

export const HIGH_WITHDRAWAL_PCT = 20;

export function TrendChart({
  points,
  labels,
}: {
  points: ConsentTrendPoint[];
  labels: { granted: string; withdrawn: string };
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={axis} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
        <YAxis tick={axis} tickFormatter={numberTick} width={48} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Line type="monotone" dataKey="granted" name={labels.granted} stroke="var(--chart-positive)" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="withdrawn"
          name={labels.withdrawn}
          stroke="var(--chart-negative)"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PurposeChart({
  items,
  labels,
}: {
  items: PurposeBreakdown[];
  labels: { granted: string; withdrawn: string };
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, items.length * 32 + 48)}>
      <BarChart data={items} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={axis} tickFormatter={numberTick} allowDecimals={false} />
        <YAxis type="category" dataKey="purposeName" tick={axis} width={160} interval={0} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Bar dataKey="granted" name={labels.granted} stackId="c" fill="var(--chart-positive)" />
        <Bar dataKey="withdrawn" name={labels.withdrawn} stackId="c" fill="var(--chart-negative)">
          {items.map((p) => (
            <Cell
              key={p.purposeId}
              fill={p.withdrawalRate > HIGH_WITHDRAWAL_PCT ? "var(--chart-negative)" : "var(--chart-caution)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChannelChart({ items }: { items: Array<ChannelBreakdown & { label: string }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={items} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axis} />
        <YAxis tick={axis} tickFormatter={numberTick} width={48} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
