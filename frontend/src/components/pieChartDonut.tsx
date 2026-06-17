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

import { useEffect, useState } from "react"
import { getProtocols } from "@/lib/api"

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
]

const ACTIVE_INDEX = 0

export function ProtocolDistribution() {
  const [chartData, setChartData] = useState<{ protocol: string; percentage: number; fill: string }[]>([])

  const chartConfig = {
    percentage: {
      label: "Percentage",
    },
  } satisfies ChartConfig

  useEffect(() => {
    let mounted = true;

    const fetchProtocols = async () => {
      try {
        const data = await getProtocols();
        if (mounted && data) {
          const entries = Object.entries(data).map(([protocol, stats]: [string, any], index) => ({
            protocol,
            percentage: stats.percentage || 0,
            fill: chartColors[index % chartColors.length],
          }));
          setChartData(entries);
        }
      } catch (error) {
        console.error("Error fetching protocols:", error);
      }
    };

    fetchProtocols();
    const interval = setInterval(fetchProtocols, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  
  const totalPercentage = chartData.reduce(
    (acc, curr) => acc + curr.percentage,
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
              dataKey="percentage"
              nameKey="protocol"
              fill="var(--chart-1)"
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
                          {totalPercentage.toFixed(1)}%
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Coverage
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