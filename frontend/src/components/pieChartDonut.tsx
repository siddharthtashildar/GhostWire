"use client"

import { Pie, PieChart, Sector, Label } from "recharts"
import type { PieSectorShapeProps } from "recharts/types/polar/Pie"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  { protocol: "TCP", packets: 273, fill: "var(--chart-1)" },
  { protocol: "UDP", packets: 42, fill: "var(--chart-2)" },
  { protocol: "ICMP", packets: 3, fill: "var(--chart-3)" },
  { protocol: "IPv6", packets: 17, fill: "var(--chart-4)" },
]

const chartConfig = {
  packets: {
    label: "Packets",
  },
  TCP: {
    label: "TCP",
    color: "var(--chart-1)",
  },
  UDP: {
    label: "UDP",
    color: "var(--chart-2)",
  },
  ICMP: {
    label: "ICMP",
    color: "var(--chart-3)",
  },
  IPv6: {
    label: "IPv6",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const ACTIVE_INDEX = 0

export function ProtocolDistribution() {
  const totalPackets = chartData.reduce(
    (acc, curr) => acc + curr.packets,
    0
  )

  return (
    <Card className="flex flex-col " >
      <CardHeader className="items-center pb-0">
        <CardTitle>Protocol Distribution</CardTitle>
        <CardDescription>
          Network traffic breakdown
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={chartData}
              dataKey="packets"
              nameKey="protocol"
              innerRadius={70}
              outerRadius={100}
              strokeWidth={5}
              shape={({
                index,
                outerRadius = 0,
                ...props
              }: PieSectorShapeProps) =>
                index === ACTIVE_INDEX ? (
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 10}
                  />
                ) : (
                  <Sector
                    {...props}
                    outerRadius={outerRadius}
                  />
                )
              }
            >
              <Label
                content={({ viewBox }) => {
                  if (
                    viewBox &&
                    "cx" in viewBox &&
                    "cy" in viewBox
                  ) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalPackets}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Packets
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="font-medium">
          TCP dominates current network traffic
        </div>

      </CardFooter>
    </Card>
  )
}