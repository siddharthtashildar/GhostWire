"""
api.py — FastAPI server exposing the network analyzer over HTTP.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import threading

import time
from ml.collector import save_snapshot


from packet_capture.analyzer import PacketAnalyzer
from packet_capture.sniffer import PacketSniffer
from packet_capture.statistics import NetworkStatistics

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="GhostWire", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global shared state
analyzer = PacketAnalyzer()
current_sniffer: PacketSniffer | None = None
capture_lock = threading.Lock()
last_packet_count = 0
last_collection_time = time.time()


# ── Request / Response models ──────────────────────────────────────────────

class CaptureConfig(BaseModel):
    interface: Optional[str] = None   # e.g. "eth0", None = default
    packet_count: int = 0
    timeout: Optional[int] = None     # seconds

class LoadPcapRequest(BaseModel):
    filepath: str                     # e.g. "/home/user/capture.pcap"


# ── Capture control ────────────────────────────────────────────────────────

@app.post("/capture/start")
def start_capture(config: CaptureConfig, background_tasks: BackgroundTasks):
    """Start a live packet capture in the background."""
    global current_sniffer

    with capture_lock:
        if current_sniffer is not None and current_sniffer.is_running():
            raise HTTPException(status_code=409, detail="Capture already running")

        analyzer.clear()        # reset previous session
        current_sniffer = PacketSniffer(
            interface=config.interface,
            packet_count=config.packet_count,
            timeout=config.timeout,
        )
        current_sniffer.analyzer = analyzer

    def run():
        global current_sniffer
        try:
            current_sniffer.start()
        finally:
            with capture_lock:
                current_sniffer = None

    background_tasks.add_task(run)
    return {"status": "started", "config": config.model_dump()}


@app.post("/capture/stop")
def stop_capture():
    """Stop live capture if it is running."""
    with capture_lock:
        if current_sniffer is None or not current_sniffer.is_running():
            return {"status": "not_running", "packets_so_far": analyzer.get_packet_count()}
        current_sniffer.stop()

    return {"status": "stopping", "packets_so_far": analyzer.get_packet_count()}


@app.get("/capture/status")
def capture_status():
    """Return whether live capture is currently running and the current packet count."""
    with capture_lock:
        running = bool(current_sniffer and current_sniffer.is_running())
    return {"is_capturing": running, "packets_so_far": analyzer.get_packet_count()}


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
def top_ports(n: int = 5, direction: str = "both"):
    """Top N most-seen ports. direction: src | dst | both"""
    stats = NetworkStatistics(analyzer)
    return stats.get_top_ports(n=n, direction=direction)


@app.get("/stats/top-ips")
def top_ips(n: int = 5, direction: str = "src"):
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
    with capture_lock:
        is_capturing = bool(current_sniffer and current_sniffer.is_running())

    return {
        "status": "ok",
        "is_capturing": is_capturing,
        "packets_so_far": analyzer.get_packet_count(),
    }




def generate_ml_snapshot():
    global last_packet_count
    global last_collection_time

    window_seconds = 60

    records = analyzer.get_records_in_timerange(
        time.time() - window_seconds,
        time.time()
    )

    total_packets = len(records)

    current_time = time.time()

    elapsed = current_time - last_collection_time

    pps = 0

    pps = round(
        total_packets / window_seconds,
        2
    )

    last_packet_count = total_packets
    last_collection_time = current_time

    if total_packets == 0:
        return {
            "packet_count": 0,
            "pps": 0,
            "unique_ips": 0,
            "unique_ports": 0,
            "tcp_ratio": 0,
            "udp_ratio": 0,
            "icmp_ratio": 0,
            "avg_packet_size": 0,
        }

    unique_ips = len(
        {r.src_ip for r in records}
        |
        {r.dst_ip for r in records}
    )

    unique_ports = len(
        {
            r.src_port
            for r in records
            if r.src_port is not None
        }
        |
        {
            r.dst_port
            for r in records
            if r.dst_port is not None
        }
    )

    tcp_count = sum(
        1
        for r in records
        if r.protocol_name == "TCP"
    )

    udp_count = sum(
        1
        for r in records
        if r.protocol_name == "UDP"
    )

    icmp_count = sum(
        1
        for r in records
        if r.protocol_name == "ICMP"
    )

    avg_packet_size = (
        sum(r.length for r in records)
        / total_packets
    )

    return {
        "packet_count": total_packets,
        "pps": round(pps, 2),
        "unique_ips": unique_ips,
        "unique_ports": unique_ports,
        "tcp_ratio": round(tcp_count / total_packets, 4),
        "udp_ratio": round(udp_count / total_packets, 4),
        "icmp_ratio": round(icmp_count / total_packets, 4),
        "avg_packet_size": round(avg_packet_size, 2),
    }

@app.get("/ml/snapshot")
def ml_snapshot():
    return generate_ml_snapshot()


def ml_collector():
    while True:

        if analyzer.get_packet_count() > 20:

            snapshot = generate_ml_snapshot()

            save_snapshot(snapshot)

        time.sleep(5)


@app.on_event("startup")
def start_ml_collector():

    thread = threading.Thread(
        target=ml_collector,
        daemon=True,
    )

    thread.start()

    print("[ML] Background collector started")