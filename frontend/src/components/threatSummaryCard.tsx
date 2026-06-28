"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { useEffect, useState } from "react"

export function AIThreatSummary({
    activity,
    confidence,
    threat_score,
}: {
    activity: string;
    confidence: number;
    threat_score: number;
}) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Summary</CardTitle>

        <CardDescription>
          Machine learning analysis of current
          network activity
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <p className="text-lg font-semibold">
            
            Current Activity:  {activity || "No data available"}
          </p>

          <p className="text-muted-foreground text-sm mt-1">
            Confidence: {confidence || "N/A"}%
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Threat Score</span>

            <span className="font-medium text-green-500">
              {threat_score || "N/A"} / 100
            </span>
          </div>

          <div className="flex justify-between">
            <span>Anomalies Detected</span>

            <span>2</span>
          </div>

          <div className="flex justify-between">
            <span>Confidence</span>

            <span>{confidence || "N/A"}%</span>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium">
            AI Insights
          </p>

          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              • HTTPS traffic remains within
              expected baseline
            </li>

            <li>
              • DNS request volume appears normal
            </li>

            <li>
              • No suspicious port scanning
              activity detected
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}