"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/moodle";

// Categorical palette (fixed order — validated for CVD-safety, see dataviz skill).
const CATEGORICAL = [
  { light: "#2a78d6", dark: "#3987e5" }, // blue
  { light: "#008300", dark: "#008300" }, // green
  { light: "#e87ba4", dark: "#d55181" }, // magenta
  { light: "#eda100", dark: "#c98500" }, // yellow
  { light: "#1baf7a", dark: "#199e70" }, // aqua
  { light: "#eb6834", dark: "#d95926" }, // orange
  { light: "#4a3aa7", dark: "#9085e9" }, // violet
  { light: "#e34948", dark: "#e66767" }, // red
];
const SEQUENTIAL_BLUE = { light: "#2a78d6", dark: "#3987e5" };

const BAR_MAX_THICKNESS = 24;
const BAR_GAP = 2;

function Bars({
  data,
  colorFor,
}: {
  data: { label: string; value: number }[];
  colorFor: (index: number) => { light: string; dark: string };
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 560;
  const height = 200;
  const barSlot = Math.min(BAR_MAX_THICKNESS + BAR_GAP * 4, (width - 16) / Math.max(1, data.length));
  const barWidth = Math.min(BAR_MAX_THICKNESS, barSlot - BAR_GAP);

  return (
    <div className="viz-root">
      <style>{`
        .viz-root { color-scheme: light; }
        .viz-root .grid-line { stroke: #e1e0d9; }
        .viz-root .axis-text { fill: #898781; }
        @media (prefers-color-scheme: dark) {
          .viz-root { color-scheme: dark; }
          .viz-root .grid-line { stroke: #2c2c2a; }
        }
      `}</style>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            className="grid-line"
            x1={8}
            x2={width - 8}
            y1={16 + t * (height - 48)}
            y2={16 + t * (height - 48)}
            strokeWidth={1}
          />
        ))}
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / max) * (height - 48));
          const x = 8 + i * barSlot + (barSlot - barWidth) / 2;
          const y = height - 32 - barHeight;
          const color = colorFor(i);
          const isHovered = hovered === i;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <title>{`${d.label}: ${d.value}`}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color.light}
                opacity={isHovered ? 1 : 0.9}
                className="dark:hidden"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color.dark}
                opacity={isHovered ? 1 : 0.9}
                className="hidden dark:block"
              />
              {isHovered && (
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize={11} className="axis-text" fill="currentColor">
                  {d.value}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - 14}
                textAnchor="middle"
                fontSize={10}
                className="axis-text"
              >
                {data.length > 10 ? "" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function groupByDay(entries: LogEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const date = new Date(entry.timecreated * 1000);
    const key = date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .slice(-14);
}

function groupByAction(entries: LogEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function ActivityCharts({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Todavía no hay actividad registrada para mostrar en gráficas.
      </div>
    );
  }

  const byDay = groupByDay(entries);
  const byAction = groupByAction(entries);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-100">Actividad por día</h3>
        <Bars data={byDay} colorFor={() => SEQUENTIAL_BLUE} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-100">Acciones más frecuentes</h3>
        <Bars data={byAction} colorFor={(i) => CATEGORICAL[i % CATEGORICAL.length]} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {byAction.map((d, i) => (
            <span key={d.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CATEGORICAL[i % CATEGORICAL.length].light }}
              />
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
