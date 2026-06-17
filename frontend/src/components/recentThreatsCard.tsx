"use client"

import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const threats = [
  {
    title: "High DNS Activity",
    severity: "Medium",
    time: "2 min ago",
  },

  {
    title: "Unusual Port Access",
    severity: "Low",
    time: "8 min ago",
  },

  {
    title: "Traffic Spike Detected",
    severity: "High",
    time: "15 min ago",
  },
]

function SeverityIcon(
  severity: string
) {
  switch (severity) {
    case "High":
      return (
        <ShieldAlert className="h-4 w-4 text-red-500" />
      )

    case "Medium":
      return (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      )

    default:
      return (
        <ShieldCheck className="h-4 w-4 text-green-500" />
      )
  }
}

export function RecentThreats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Threats</CardTitle>

        <CardDescription>
          Latest anomaly detections
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {threats.map((threat) => (
            <div
              key={threat.title}
              className="flex items-start justify-between rounded-lg border p-3"
            >
              <div className="flex gap-3">
                {SeverityIcon(
                  threat.severity
                )}

                <div>
                  <p className="font-medium">
                    {threat.title}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {threat.time}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-medium ${
                  threat.severity === "High"
                    ? "text-red-500"
                    : threat.severity ===
                      "Medium"
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {threat.severity}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}