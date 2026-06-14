"""
statistics.py — Network traffic statistics and summary module.

Consumes a PacketAnalyzer instance and exposes high-level aggregation
functions used for reporting and dashboards.

Public API
----------
  get_packet_count()     → int
  get_protocol_stats()   → dict[str, dict]
  get_top_ports()        → list[dict]
  get_top_ips()          → list[dict]
  get_bandwidth_stats()  → dict
  get_summary_report()   → dict   (combines all of the above)
"""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import TYPE_CHECKING, Dict, List, Optional

if TYPE_CHECKING:
    from analyzer import PacketAnalyzer


class NetworkStatistics:
    """
    Calculates summaries and statistics from a PacketAnalyzer.

    All methods are read-only — they never modify the analyzer's records.
    """

    def __init__(self, analyzer: "PacketAnalyzer") -> None:
        """
        Args:
            analyzer: A populated PacketAnalyzer instance.
        """
        self._analyzer = analyzer

    # ------------------------------------------------------------------
    # 1. Packet count
    # ------------------------------------------------------------------

    def get_packet_count(self) -> int:
        """
        Return the total number of captured packets.

        Returns:
            int: Total packet count.

        Example:
            >>> stats.get_packet_count()
            1024
        """
        return self._analyzer.get_packet_count()

    # ------------------------------------------------------------------
    # 2. Protocol statistics
    # ------------------------------------------------------------------

    def get_protocol_stats(self) -> Dict[str, Dict]:
        """
        Return per-protocol breakdown: count, total bytes, and share (%).

        Returns:
            dict keyed by protocol name, each value containing:
              • "count"      – number of packets
              • "bytes"      – total bytes transferred
              • "percentage" – share of total packets (0–100, rounded to 2 dp)

        Example:
            >>> stats.get_protocol_stats()
            {
              "TCP":  {"count": 800, "bytes": 512000, "percentage": 78.12},
              "UDP":  {"count": 200, "bytes":  64000, "percentage": 19.53},
              "ICMP": {"count":  24, "bytes":   1920, "percentage":  2.34},
            }
        """
        records = self._analyzer.get_all_records()
        total   = len(records)

        proto_count = Counter()
        proto_bytes = defaultdict(int)

        for r in records:
            proto_count[r.protocol_name] += 1
            proto_bytes[r.protocol_name] += r.length

        result = {}
        for proto, count in proto_count.most_common():
            result[proto] = {
                "count":      count,
                "bytes":      proto_bytes[proto],
                "percentage": round(count / total * 100, 2) if total else 0.0,
            }
        return result

    # ------------------------------------------------------------------
    # 3. Top ports
    # ------------------------------------------------------------------

    def get_top_ports(
        self,
        n: int = 10,
        direction: str = "both",
    ) -> List[Dict]:
        """
        Return the N most frequently seen ports.

        Args:
            n:         Number of top ports to return (default 10).
            direction: Which port column(s) to count:
                         'src'  – source ports only
                         'dst'  – destination ports only
                         'both' – count src and dst ports together (default)

        Returns:
            List of dicts, each with:
              • "port"       – port number
              • "count"      – total occurrences
              • "percentage" – share of all port observations

        Example:
            >>> stats.get_top_ports(5)
            [
              {"port": 443,  "count": 340, "percentage": 33.2},
              {"port": 80,   "count": 210, "percentage": 20.5},
              ...
            ]
        """
        records = self._analyzer.get_all_records()
        port_counter: Counter = Counter()

        for r in records:
            if not r.has_ports:
                continue
            if direction in ("src", "both") and r.src_port is not None:
                port_counter[r.src_port] += 1
            if direction in ("dst", "both") and r.dst_port is not None:
                port_counter[r.dst_port] += 1

        total_observations = sum(port_counter.values())

        return [
            {
                "port":       port,
                "count":      count,
                "percentage": round(count / total_observations * 100, 2)
                              if total_observations else 0.0,
            }
            for port, count in port_counter.most_common(n)
        ]

    # ------------------------------------------------------------------
    # 4. Top IPs
    # ------------------------------------------------------------------

    def get_top_ips(
        self,
        n: int = 10,
        direction: str = "src",
    ) -> List[Dict]:
        """
        Return the N most frequently seen IP addresses.

        Args:
            n:         Number of top IPs to return (default 10).
            direction: Which IP column to rank:
                         'src'  – source IPs (default)
                         'dst'  – destination IPs
                         'both' – combine src and dst into one ranking

        Returns:
            List of dicts, each with:
              • "ip"         – IP address string
              • "count"      – number of packets
              • "bytes"      – total bytes from/to that IP
              • "percentage" – share of total packets

        Example:
            >>> stats.get_top_ips(3, direction="src")
            [
              {"ip": "192.168.1.5", "count": 400, "bytes": 256000, "percentage": 39.1},
              ...
            ]
        """
        records = self._analyzer.get_all_records()
        total   = len(records)

        ip_count = Counter()
        ip_bytes = defaultdict(int)

        for r in records:
            if direction in ("src", "both"):
                ip_count[r.src_ip] += 1
                ip_bytes[r.src_ip] += r.length
            if direction in ("dst", "both"):
                ip_count[r.dst_ip] += 1
                ip_bytes[r.dst_ip] += r.length

        total_observations = sum(ip_count.values())

        return [
            {
                "ip":         ip,
                "count":      count,
                "bytes":      ip_bytes[ip],
                "percentage": round(count / total_observations * 100, 2)
                              if total_observations else 0.0,
            }
            for ip, count in ip_count.most_common(n)
        ]

    # ------------------------------------------------------------------
    # 5. Bandwidth statistics
    # ------------------------------------------------------------------

    def get_bandwidth_stats(self) -> Dict:
        """
        Return aggregate bandwidth metrics.

        Returns:
            dict with:
              • "total_bytes"     – sum of all packet lengths
              • "total_kb"        – total_bytes / 1024 (rounded 2 dp)
              • "total_mb"        – total_bytes / 1024² (rounded 2 dp)
              • "avg_packet_size" – mean bytes per packet (rounded 2 dp)
              • "max_packet_size" – largest packet in bytes
              • "min_packet_size" – smallest packet in bytes

        Example:
            >>> stats.get_bandwidth_stats()
            {"total_bytes": 2097152, "total_kb": 2048.0, "total_mb": 2.0, ...}
        """
        records = self._analyzer.get_all_records()
        if not records:
            return {
                "total_bytes":     0,
                "total_kb":        0.0,
                "total_mb":        0.0,
                "avg_packet_size": 0.0,
                "max_packet_size": 0,
                "min_packet_size": 0,
            }

        lengths = [r.length for r in records]
        total   = sum(lengths)

        return {
            "total_bytes":     total,
            "total_kb":        round(total / 1024, 2),
            "total_mb":        round(total / (1024 ** 2), 2),
            "avg_packet_size": round(total / len(lengths), 2),
            "max_packet_size": max(lengths),
            "min_packet_size": min(lengths),
        }

    # ------------------------------------------------------------------
    # 6. Full summary report
    # ------------------------------------------------------------------

    def get_summary_report(
        self,
        top_n: int = 5,
    ) -> Dict:
        """
        Combine all statistics into a single summary dict.

        Args:
            top_n: How many entries to include in top-ports / top-ips lists.

        Returns:
            dict with keys:
              "packet_count", "protocol_stats", "bandwidth",
              "top_ports", "top_src_ips", "top_dst_ips"

        Example:
            >>> import json
            >>> print(json.dumps(stats.get_summary_report(top_n=3), indent=2))
        """
        return {
            "packet_count":   self.get_packet_count(),
            "protocol_stats": self.get_protocol_stats(),
            "bandwidth":      self.get_bandwidth_stats(),
            "top_ports":      self.get_top_ports(top_n),
            "top_src_ips":    self.get_top_ips(top_n, direction="src"),
            "top_dst_ips":    self.get_top_ips(top_n, direction="dst"),
        }

    # ------------------------------------------------------------------
    # Pretty printer
    # ------------------------------------------------------------------

    def print_report(self, top_n: int = 5) -> None:
        """Print a human-readable summary to stdout."""
        report = self.get_summary_report(top_n)

        sep = "─" * 50

        print(f"\n{'═' * 50}")
        print(" NETWORK CAPTURE SUMMARY")
        print(f"{'═' * 50}")

        print(f"\n  Total packets : {report['packet_count']}")
        bw = report["bandwidth"]
        print(f"  Total traffic : {bw['total_mb']} MB  ({bw['total_bytes']} bytes)")
        print(f"  Avg pkt size  : {bw['avg_packet_size']} bytes")

        print(f"\n{sep}")
        print("  PROTOCOL BREAKDOWN")
        print(sep)
        for proto, data in report["protocol_stats"].items():
            bar = "█" * int(data["percentage"] / 2)
            print(f"  {proto:<8} {data['count']:>6} pkts  {data['percentage']:>6.2f}%  {bar}")

        print(f"\n{sep}")
        print(f"  TOP {top_n} SOURCE IPs")
        print(sep)
        for entry in report["top_src_ips"]:
            print(f"  {entry['ip']:<18} {entry['count']:>5} pkts  {entry['percentage']:>6.2f}%")

        print(f"\n{sep}")
        print(f"  TOP {top_n} DESTINATION IPs")
        print(sep)
        for entry in report["top_dst_ips"]:
            print(f"  {entry['ip']:<18} {entry['count']:>5} pkts  {entry['percentage']:>6.2f}%")

        print(f"\n{sep}")
        print(f"  TOP {top_n} PORTS")
        print(sep)
        for entry in report["top_ports"]:
            print(f"  Port {entry['port']:<7} {entry['count']:>5} obs   {entry['percentage']:>6.2f}%")

        print(f"{'═' * 50}\n")


# ---------------------------------------------------------------------------
# Quick self-test with synthetic data (no Scapy required)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from analyzer import PacketAnalyzer

    analyzer = PacketAnalyzer()

    # Inject some fake records for testing
    import random, time as _time

    protocols = [
        ("TCP",  6, (80, 443, 22, 8080)),
        ("UDP",  17, (53, 123, 514)),
        ("ICMP", 1,  (None,)),
    ]
    ips = ["10.0.0.1", "10.0.0.2", "192.168.1.1", "8.8.8.8", "1.1.1.1"]

    for _ in range(200):
        proto_name, proto_num, ports = random.choice(protocols)
        port = random.choice(ports)
        analyzer.add_record({
            "src_ip":        random.choice(ips),
            "dst_ip":        random.choice(ips),
            "protocol":      proto_num,
            "protocol_name": proto_name,
            "length":        random.randint(64, 1500),
            "src_port":      random.randint(1024, 65535) if port else None,
            "dst_port":      port,
            "flags":         "PA" if proto_name == "TCP" else None,
            "timestamp":     _time.time() - random.uniform(0, 60),
        })

    stats = NetworkStatistics(analyzer)
    stats.print_report(top_n=5)