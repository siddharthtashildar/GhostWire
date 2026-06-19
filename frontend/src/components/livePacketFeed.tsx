"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { getRecords } from "@/lib/api"

interface PacketRecord {
  timestamp: number
  src_ip: string
  dst_ip: string
  protocol: number
  protocol_name: string
  length: number
  src_port?: number | null
  dst_port?: number | null
  flags?: string | null
  [key: string]: any
}

interface RecordsResponse {
  total: number
  offset: number
  limit: number
  records: PacketRecord[]
}

function formatTimestamp(timestamp: number) {
  try {
    return new Date(timestamp * 1000).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  } catch {
    return String(timestamp)
  }
}

function recordMatchesSearch(record: PacketRecord, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return Object.values(record).some((value) => {
    if (value === null || value === undefined) return false
    return String(value).toLowerCase().includes(normalized)
  })
}

function PacketDetailSheet({
  open,
  record,
  onClose,
}: {
  open: boolean
  record: PacketRecord | null
  onClose: () => void
}) {
  if (!open || !record) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-t-3xl bg-card text-card-foreground shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Packet Details</h2>
            <p className="text-sm text-muted-foreground">Click outside or close to dismiss.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs uppercase text-muted-foreground">Source</p>
              <p className="mt-2 font-medium">
                {record.src_ip}
                {record.src_port ? `:${record.src_port}` : ""}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs uppercase text-muted-foreground">Destination</p>
              <p className="mt-2 font-medium">
                {record.dst_ip}
                {record.dst_port ? `:${record.dst_port}` : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs uppercase text-muted-foreground">Protocol</p>
              <p className="mt-2 font-medium">{record.protocol_name}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs uppercase text-muted-foreground">Length</p>
              <p className="mt-2 font-medium">{record.length} bytes</p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs uppercase text-muted-foreground">Timestamp</p>
              <p className="mt-2 font-medium">{formatTimestamp(record.timestamp)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-xs uppercase text-muted-foreground">Flags</p>
            <p className="mt-2 font-medium">{record.flags ?? "-"}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-xs uppercase text-muted-foreground">Raw packet JSON</p>
            <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(record, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LivePacketFeed() {
  const [records, setRecords] = useState<PacketRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<PacketRecord | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalPackets, setTotalPackets] = useState(0)

  const filteredRecords = useMemo(
    () => records.filter((record) => recordMatchesSearch(record, searchTerm)),
    [records, searchTerm]
  )

  useEffect(() => {
    let mounted = true

    const fetchLatestPackets = async () => {
      try {
        setLoading(true)
        const summary = await getRecords(1, 0)
        const latestOffset = Math.max(summary.total - 50, 0)
        const response = await getRecords(50, latestOffset)
        if (!mounted) return

        setTotalPackets(response.total)
        setRecords(response.records.reverse())
      } catch (error) {
        console.error("Failed to fetch packet records:", error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchLatestPackets()
    const interval = setInterval(fetchLatestPackets, 2500)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const openRecord = (record: PacketRecord) => {
    setSelectedRecord(record)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6 px-6 py-6 lg:px-48">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Live Packet Feed</h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-[220px]">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search packets"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="secondary" size="sm" className="py-4.5 px-6" onClick={() => setSearchTerm("")}>Clear</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packet Stream</CardTitle>
          <CardDescription>
            Showing the latest packets from the capture. Total packets: {totalPackets}. {loading ? "Refreshing..." : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Proto</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Length</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record, index) => (
                <TableRow
                  key={`${record.timestamp}-${record.src_ip}-${record.dst_ip}-${index}`}
                  className="cursor-pointer"
                  onClick={() => openRecord(record)}
                >
                  <TableCell className="font-mono text-muted-foreground text-left">
                    {formatTimestamp(record.timestamp)}
                  </TableCell>
                  <TableCell className="text-left">{record.protocol_name}</TableCell>
                  <TableCell className="font-mono text-left">{record.src_ip}{record.src_port ? `:${record.src_port}` : ""}</TableCell>
                  <TableCell className="font-mono text-left" >{record.dst_ip}{record.dst_port ? `:${record.dst_port}` : ""}</TableCell>
                  <TableCell className="font-mono text-left">{record.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PacketDetailSheet open={sheetOpen} record={selectedRecord} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
