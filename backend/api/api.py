"""
api.py — FastAPI server exposing the network analyzer over HTTP.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import threading

from packet_capture.analyzer import PacketAnalyzer
from packet_capture.sniffer import PacketSniffer
from packet_capture.statistics import NetworkStatistics

app = FastAPI(title="GhostWire", version="1.0.0")

# Global shared state
analyzer = PacketAnalyzer()
capture_thread = None
is_capturing = False


# ── Request / Response models ──────────────────────────────────────────────

class CaptureConfig(BaseModel):
    interface: Optional[str] = None   # e.g. "eth0", None = default
    packet_count: int = 100
    timeout: Optional[int] = None     # seconds

class LoadPcapRequest(BaseModel):
    filepath: str                     # e.g. "/home/user/capture.pcap"


# ── Capture control ────────────────────────────────────────────────────────

@app.post("/capture/start")
def start_capture(config: CaptureConfig, background_tasks: BackgroundTasks):
    """Start a live packet capture in the background."""
    global is_capturing, analyzer

    if is_capturing:
        raise HTTPException(status_code=409, detail="Capture already running")

    analyzer.clear()        # reset previous session
    is_capturing = True

    def run():
        global is_capturing
        sniffer = PacketSniffer(
            interface=config.interface,
            packet_count=config.packet_count,
            timeout=config.timeout,
        )
        sniffer.analyzer = analyzer
        sniffer.start()
        is_capturing = False

    background_tasks.add_task(run)
    return {"status": "started", "config": config.model_dump()}


@app.post("/capture/stop")
def stop_capture():
    """Check capture status (Scapy stops automatically at packet_count)."""
    return {"is_capturing": is_capturing, "packets_so_far": analyzer.get_packet_count()}


@app.post("/capture/load")
def load_pcap(request: LoadPcapRequest):
    """Load packets from a .pcap file instead of live capture."""
    global analyzer
    analyzer.clear()
    sniffer = PacketSniffer()
    sniffer.analyzer = analyzer
    try:
        sniffer.load_pcap(request.filepath)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")
    return {"loaded": analyzer.get_packet_count(), "filepath": request.filepath}


# ── Statistics endpoints ───────────────────────────────────────────────────

@app.get("/stats/count")
def packet_count():
    """Total number of captured packets."""
    return {"packet_count": analyzer.get_packet_count()}


@app.get("/stats/protocols")
def protocol_stats():
    """Breakdown by protocol: TCP, UDP, ICMP, etc."""
    stats = NetworkStatistics(analyzer)
    return stats.get_protocol_stats()


@app.get("/stats/top-ports")
def top_ports(n: int = 10, direction: str = "both"):
    """Top N most-seen ports. direction: src | dst | both"""
    stats = NetworkStatistics(analyzer)
    return stats.get_top_ports(n=n, direction=direction)


@app.get("/stats/top-ips")
def top_ips(n: int = 10, direction: str = "src"):
    """Top N most-seen IPs. direction: src | dst | both"""
    stats = NetworkStatistics(analyzer)
    return stats.get_top_ips(n=n, direction=direction)


@app.get("/stats/bandwidth")
def bandwidth():
    """Total bytes, average packet size, min/max."""
    stats = NetworkStatistics(analyzer)
    return stats.get_bandwidth_stats()


@app.get("/stats/summary")
def summary(top_n: int = 5):
    """Full summary report combining all statistics."""
    stats = NetworkStatistics(analyzer)
    return stats.get_summary_report(top_n=top_n)


# ── Records ────────────────────────────────────────────────────────────────

@app.get("/records")
def get_records(limit: int = 50, offset: int = 0):
    """Paginated list of raw packet records."""
    all_records = analyzer.export_to_dicts()
    return {
        "total": len(all_records),
        "offset": offset,
        "limit": limit,
        "records": all_records[offset : offset + limit],
    }


@app.delete("/records")
def clear_records():
    """Wipe all stored packet records."""
    analyzer.clear()
    return {"status": "cleared"}


# ── Health ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "is_capturing": is_capturing}