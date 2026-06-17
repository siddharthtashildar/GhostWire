"use client"

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { useEffect, useState } from "react"
import { getTopPorts } from "@/lib/api"

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
]

const chartConfig = {
  count: {
    label: "Packets",
  },
} satisfies ChartConfig

export function TopPorts() {
  const [topPorts, setTopPorts] = useState<{ port: number; count: number }[]>([])

  useEffect(() => {
    let mounted = true;

    const fetchTopPorts = async () => {
      try {
        const data = await getTopPorts();
        if (mounted) {
          setTopPorts(data);
        }
      } catch (error) {
        console.error("Error fetching top ports:", error);
      }
    };

    fetchTopPorts();
    const interval = setInterval(fetchTopPorts, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Ports</CardTitle>

        <CardDescription>
          Most active network ports
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={topPorts.map(p => ({ ...p, port: String(p.port) }))}
            layout="vertical"
            margin={{
              left: 40,
              right: 10,
            }}
          >
            <XAxis
              type="number"
              hide
            />

            <YAxis
              dataKey="port"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              width={60}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent />
              }
            />

            <Bar
              dataKey="count"
              radius={6}
            >
              {topPorts.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}