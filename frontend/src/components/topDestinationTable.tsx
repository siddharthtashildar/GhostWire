"use client"

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getTopIps } from "@/lib/api";

interface TopIp {
  ip: string;
  count: number;
  percentage: number;
}

export function TopDestinations() {
  const [topIps, setTopIps] = useState<TopIp[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchTopIps = async () => {
      try {
        const data = await getTopIps(10, "dst");
        if (mounted) {
          setTopIps(data);
        }
      } catch (error) {
        console.error("Error fetching top IPs:", error);
      }
    };

    fetchTopIps();
    const interval = setInterval(fetchTopIps, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Destinations</CardTitle>

        <CardDescription>
          Most active external connections
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP Address</TableHead>
              <TableHead>Packets</TableHead>
              <TableHead className="text-right">
                Percentage
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {topIps.map((entry) => (
              <TableRow
                key={entry.ip}
              >
                <TableCell className="font-mono text-muted-foreground">
                  {entry.ip}
                </TableCell>

                <TableCell className="font-medium">
                  {entry.count.toLocaleString()}
                </TableCell>

                <TableCell className="text-right font-medium">
                  {entry.percentage.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}