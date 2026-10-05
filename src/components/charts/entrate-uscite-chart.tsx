"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type EntrateUsciteMese = { mese: string; entrate: number; uscite: number };

export function EntrateUsciteChart({ dati }: { dati: EntrateUsciteMese[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dati} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="mese"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) => `€${v}`}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
          formatter={(value, name) => [`€${Number(value).toFixed(2)}`, name === "entrate" ? "Entrate" : "Uscite"]}
        />
        <Legend formatter={(v) => (v === "entrate" ? "Entrate" : "Uscite")} />
        <Bar dataKey="entrate" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="uscite" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
