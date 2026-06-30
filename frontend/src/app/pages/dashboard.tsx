"use client";
import { ProtocolDistribution } from "@/components/pieChartDonut";
import { RecentThreats } from "@/components/recentThreatsCard";
import { ThreatScoreCard } from "@/components/threatScore";
import { AIThreatSummary } from "@/components/threatSummaryCard";
import { TopDestinations } from "@/components/topDestinationTable";
import { TopPorts } from "@/components/topPortsChart";
import { TrafficTimeline } from "@/components/traffic-Timeline";

import { useEffect, useState } from "react";
import { getPacketCount, getTopIps, getBandwidth } from "../../lib/api";
import { useAI } from "@/lib/func";

interface BandwidthStats {
    total_bytes: number;
    total_kb: number;
    total_mb: number;
    avg_packet_size: number;
    max_packet_size: number;
    min_packet_size: number;
}



function Dashboard() {
    const [packetCount, setPacketCount] = useState(0);
    const [packetsPerSecond, setPacketsPerSecond] = useState(0);
    const [activeConnections, setActiveConnections] = useState(0);
    const [bandwidthStats, setBandwidthStats] = useState<BandwidthStats | null>(null);
    const [timelineData, setTimelineData] = useState<{ time: string; pps: number }[]>([]);

    const ai = useAI()



    useEffect(() => {
        let mounted = true;
        let lastCount = 0;
        let lastTime = Date.now();

        const fetchMetrics = async () => {
            try {
                const [countData, ipsData] = await Promise.all([
                    getPacketCount(),
                    getTopIps(100, "both"),
                ]);

                if (mounted) {
                    const newCount = countData.packet_count ?? 0;
                    const now = Date.now();
                    const timeDiffMs = now - lastTime;
                    const timeDiffSec = timeDiffMs / 1000;

                    if (timeDiffSec > 0 && newCount >= lastCount) {
                        const pps = Math.round((newCount - lastCount) / timeDiffSec);
                        const validPps = Math.max(0, pps);
                        setPacketsPerSecond(validPps);
                        
                        setTimelineData(prev => {
                            const timeStr = new Date(now).toLocaleTimeString([], { hour12: false });
                            const newData = [...prev, { time: timeStr, pps: validPps }];
                            return newData.slice(-20); // Keep the last 20 data points for the timeline
                        });
                    }

                    setPacketCount(newCount);
                    lastCount = newCount;
                    lastTime = now;

                    const uniqueIps = new Set<string>();
                    ipsData.forEach((ip: any) => {
                        if (ip.ip) uniqueIps.add(ip.ip);
                    });
                    setActiveConnections(uniqueIps.size);
                }

                try {
                    const bandwidthData = await getBandwidth();
                    if (mounted) {
                        setBandwidthStats(bandwidthData);
                    }
                } catch (error) {
                    console.error("Error fetching bandwidth metrics:", error);
                }
            } catch (error) {
                console.error("Error fetching metrics:", error);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);



    return (
        <div className="py-0">
            <div className="flex  items-top justify-between h-3/4 px-16 py-4 w-full gap-4">
                <div className=" border-2 border-border rounded-lg w-3/4 h-3/4">
                    <div className="flex items-center justify-between">
                        <div className="border-r-2 border-border px-4 py-2 w-1/3 h-30">
                            <h1 className="text-lg font-semibold text-muted-foreground">Total Packets</h1>
                            <div className="flex items-bottom justify-between mt-4 ">
                                <h1 className="text-3xl font-bold ml-2">{packetCount.toLocaleString()}</h1>
                            </div>
                        </div>
                        <div className="px-4 w-1/3 py-2 h-30">
                            <h1 className="text-lg font-semibold text-muted-foreground">Packets Per Second</h1>
                            <div className="flex items-bottom justify-between mt-4 ">
                                <h1 className="text-3xl font-bold ml-2">{packetsPerSecond}</h1>
                            </div>
                        </div>
                        <div className="border-l-2 border-border px-4 py-2 w-1/3 h-30">
                            <h1 className="text-lg font-semibold text-muted-foreground">Active Connections</h1>
                            <div className="flex items-bottom justify-between mt-4 ">
                                <h1 className="text-3xl font-bold ml-2">{activeConnections}</h1>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <div className="flex items-center justify-between border-t-2 border-border">
                            <div className="w-1/4 h-full background-card">
                                <ProtocolDistribution />
                            </div>
                            <div className="w-3/4 ">
                                <TrafficTimeline
                                    data={timelineData}
                                    packetsPerSecond={packetsPerSecond}
                                    bandwidth={bandwidthStats}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="justify-top border-2 border-border rounded-lg  w-1/4 ">
                    <ThreatScoreCard ThreatScore={ai?.threat_score || 0} />
                </div>
            </div>
            <div className="flex items-top justify-between px-16 py-4 w-full gap-4">
                <div className="  w-3/4 h-3/4">
                    <TopDestinations />
                </div>
                <div className=" h-3/4">
                    <TopPorts />
                </div>
                <div className="  w-3/4 h-3/4">
                    <AIThreatSummary
                        activity={ai?.activity || "No data available"}
                        confidence={ai?.confidence || 0 }
                        threat_score={ai?.threat_score || 0}
                        summary={{
                            status: ai?.summary.status || "No status available",
                            findings: ai?.summary.findings || ["No findings available"],
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;