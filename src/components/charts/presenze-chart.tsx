"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PresenzaClasse = { classe: string; percentuale: number };

export function PresenzeChart({ dati }: { dati: PresenzaClasse[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, dati.length * 40)}>
      <BarChart
        data={dati}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="classe"
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
          formatter={(value) => [`${value}%`, "Presenza"]}
        />
        <Bar dataKey="percentuale" radius={[0, 4, 4, 0]}>
          {dati.map((d) => (
            <Cell
              key={d.classe}
              fill={d.percentuale < 60 ? "var(--destructive)" : "var(--primary)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
