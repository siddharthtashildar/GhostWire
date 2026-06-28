"use client"

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
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
  type ChartConfig,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"



export function ThreatScoreCard({ ThreatScore }: { ThreatScore: number }) {



  

  const chartData = [
    {
      name: "threat",
      score: ThreatScore,
      fill:
        ThreatScore > 70
          ? "#ef4444"
          : ThreatScore > 30
            ? "#f59e0b"
            : "#22c55e",
    },
  ]

  const chartConfig = {
    score: {
      label: "Threat Score",
    },
    threat: {
      label: "Threat",
      color: "#22c55e",
    },
  } satisfies ChartConfig

  function getThreatStatus(score: number) {
    if (score > 70) return "High Risk"
    if (score > 30) return "Suspicious"
    return "Secure"
  }


  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>AI Threat Score</CardTitle>

        <CardDescription>
          Real-time network risk assessment
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-98"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={-270}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              polarRadius={[86, 74]}
              className="first:fill-muted/40 last:fill-background"
            />

            <RadialBar
              dataKey="score"
              cornerRadius={12}
              background
            />

            <PolarRadiusAxis
              tick={false}
              tickLine={false}
              axisLine={false}
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
                          className="fill-foreground text-5xl font-bold"
                        >
                          {ThreatScore}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-sm"
                        >
                          /100
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>

        <div className="mt-4 text-center">
          <p className="text-lg font-semibold">
            {getThreatStatus(ThreatScore)}
          </p>

          <p className="text-muted-foreground text-sm">
            Current network security posture
          </p>
        </div>
      </CardContent>
    </Card>
  )
}