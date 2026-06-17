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

const chartData = [
  { time: "10:00", packets: 42, bandwidth: 1.2 },
  { time: "10:01", packets: 55, bandwidth: 1.8 },
  { time: "10:02", packets: 37, bandwidth: 0.9 },
  { time: "10:03", packets: 88, bandwidth: 2.7 },
  { time: "10:04", packets: 102, bandwidth: 3.4 },
  { time: "10:05", packets: 65, bandwidth: 2.1 },
  { time: "10:06", packets: 121, bandwidth: 4.2 },
  { time: "10:07", packets: 93, bandwidth: 3.1 },
  { time: "10:08", packets: 48, bandwidth: 1.5 },
  { time: "10:09", packets: 134, bandwidth: 5.3 },
  { time: "10:10", packets: 82, bandwidth: 2.8 },
  { time: "10:11", packets: 155, bandwidth: 6.2 },
  { time: "10:12", packets: 94, bandwidth: 3.7 },
  { time: "10:13", packets: 73, bandwidth: 2.5 },
  { time: "10:14", packets: 189, bandwidth: 7.1 },
  { time: "10:15", packets: 115, bandwidth: 4.4 },
]

const chartConfig = {
  packets: {
    label: "Packets/sec",
    color: "var(--chart-1)",
  },
  bandwidth: {
    label: "Bandwidth MB/s",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function TrafficTimeline() {
  const [activeChart, setActiveChart] =
    React.useState<"packets" | "bandwidth">(
      "packets"
    )

  const stats = React.useMemo(
    () => ({
      packets: Math.max(
        ...chartData.map((d) => d.packets)
      ),
      bandwidth: Math.max(
        ...chartData.map((d) => d.bandwidth)
      ),
    }),
    []
  )

  return (
    <Card className="p-0 rounded-0">
      <CardHeader className="flex flex-col items-stretch border-b-2 rounded-0 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 pt-4 pb-4 ">
          <CardTitle>Traffic Timeline</CardTitle>

          <CardDescription>
            Real-time network activity over the
            last 15 minutes
          </CardDescription>
        </div>

        <div className="flex">
          {(
            ["packets", "bandwidth"] as const
          ).map((key) => (
            <button
              key={key}
              data-active={
                activeChart === key
              }
              onClick={() =>
                setActiveChart(key)
              }
              className="relative z-30 flex flex-1 flex-col w-full justify-center gap-1 border-t text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            >
              <span className="text-xs text-muted-foreground px-2">
                {
                  chartConfig[key]
                    .label
                }
              </span>

              <span className="text-lg font-bold sm:text-3xl">
                {stats[key]}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent />
              }
            />

            <Line
              type="monotone"
              dataKey={activeChart}
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}