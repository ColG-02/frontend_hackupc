"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Container } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FILL_COLORS: Record<string, string> = {
  EMPTY: "#9ca3af",
  NORMAL: "#22c55e",
  NEAR_FULL: "#eab308",
  FULL: "#f97316",
  CRITICAL: "#ef4444",
  UNKNOWN: "#d1d5db",
};

interface Props {
  containers: Container[];
}

export function FillDistributionChart({ containers }: Props) {
  const counts = containers.reduce<Record<string, number>>((acc, c) => {
    const state = c.latest_state.fill_state ?? "UNKNOWN";
    acc[state] = (acc[state] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Fill Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={FILL_COLORS[entry.name] ?? "#9ca3af"} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} containers`, ""]} />
            <Legend
              formatter={(v) => <span className="text-xs">{v}</span>}
              iconSize={10}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
