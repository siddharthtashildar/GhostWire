"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from "recharts"

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

interface TimelineData {
  time: string;
  pps: number;
}

interface BandwidthStats {
  total_bytes: number;
  total_kb: number;
  total_mb: number;
  avg_packet_size: number;
  max_packet_size: number;
  min_packet_size: number;
}

interface TrafficTimelineProps {
  data: TimelineData[];
  packetsPerSecond: number;
  bandwidth?: BandwidthStats | null;
}

const chartConfig = {
  pps: {
    label: "Packets/sec",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function TrafficTimeline({ data, packetsPerSecond, bandwidth }: TrafficTimelineProps) {
  const formatBandwidth = () => {
    if (!bandwidth) return "Loading...";
    return `${bandwidth.total_mb.toFixed(2)} MB`;
  }

  return (
    <Card className="p-0 rounded-0">
      <CardHeader className="flex flex-col gap-4 border-b-2 rounded-0 p-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 pt-4 pb-4">
          <CardTitle>Traffic Timeline</CardTitle>
          <CardDescription>Real-time network packets per second and bandwidth.</CardDescription>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 pb-4 pt-2 sm:border-t-0 sm:border-l sm:px-6 sm:pt-4 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <p className="text-sm font-medium text-muted-foreground">Bandwidth</p>
              <p className="text-2xl font-bold">{formatBandwidth()}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              type="monotone"
              dataKey="pps"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
