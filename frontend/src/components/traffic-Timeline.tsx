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

import { useEffect, useState } from "react";
import { getPacketCount } from "@/lib/api";

interface TimelineData {
  time: string;
  packets: number;
}

const chartConfig = {
  packets: {
    label: "Packets/min",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function TrafficTimeline() {
  const [chartData, setChartData] = React.useState<TimelineData[]>([])
  const [timelineWindow, setTimelineWindow] = React.useState<Array<{ timestamp: number; count: number }>>([])
  const [lastPacketCount, setLastPacketCount] = React.useState(0)

  useEffect(() => {
    let mounted = true;

    const fetchTraffic = async () => {
      try {
        const data = await getPacketCount();
        if (mounted) {
          const newCount = data.packet_count ?? 0;
          const now = Date.now();
          const timeStr = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

          setTimelineWindow((prev) => {
            const updated = [...prev, { timestamp: now, count: newCount }];
            const cutoff = now - 15 * 60 * 1000; // 15 minutes
            const filtered = updated.filter((d) => d.timestamp > cutoff);

            const grouped = filtered.reduce<{ [key: string]: number[] }>((acc, d) => {
              const ts = new Date(d.timestamp);
              const key = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              if (!acc[key]) acc[key] = [];
              acc[key].push(d.count);
              return acc;
            }, {});

            const timeline = Object.entries(grouped)
              .map(([time, counts]) => ({
                time,
                packets: Math.max(...counts),
              }))
              .slice(-20);

            if (mounted) {
              setChartData(timeline);
            }

            return filtered;
          });

          setLastPacketCount(newCount);
        }
      } catch (error) {
        console.error("Error fetching traffic data:", error);
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

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
      </CardHeader>

      <CardContent className="p-4">
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
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
              dataKey="packets"
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