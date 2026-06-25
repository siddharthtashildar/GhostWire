"""
sniffer.py — Packet capture module using Scapy.
Captures live packets and passes them to the Analyzer.
"""

import time

from scapy.all import AsyncSniffer, wrpcap, rdpcap
from scapy.layers.inet import IP, TCP, UDP, ICMP
from .analyzer import PacketAnalyzer


class PacketSniffer:
    """Captures packets from a network interface and records them."""

    def __init__(self, interface: str = None, packet_count: int = 100, timeout: int = None):
        """
        Args:
            interface:    Network interface to sniff on (e.g. 'eth0', 'wlan0').
                          None lets Scapy pick the default interface.
            packet_count: Maximum number of packets to capture (0 = unlimited).
            timeout:      Stop sniffing after this many seconds (None = no limit).
        """
        self.interface = interface
        self.packet_count = packet_count
        self.timeout = timeout
        self.analyzer = PacketAnalyzer()
        self._sniffer: AsyncSniffer | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self) -> "PacketAnalyzer":
        """
        Start live packet capture.

        Returns:
            The PacketAnalyzer populated with every captured packet.
        """
        print(f"[*] Starting capture on interface: {self.interface or 'default'}")
        print(f"[*] Capturing {self.packet_count or 'unlimited'} packets …")

        self._sniffer = AsyncSniffer(
            iface=self.interface,
            count=self.packet_count,
            timeout=self.timeout,
            prn=self._process_packet,
            store=False,           # don't keep raw packets in memory
        )
        self._sniffer.start()
        self._sniffer.join()

        print(f"[*] Capture complete. {self.analyzer.get_packet_count()} packets recorded.")
        return self.analyzer

    def stop(self) -> None:
        """Stop an active packet capture."""
        if self._sniffer is None:
            return
        try:
            self._sniffer.stop()
        finally:
            self._sniffer.join(timeout=2)

    def is_running(self) -> bool:
        """Return True when sniffing is currently in progress."""
        return bool(self._sniffer and self._sniffer.running)

    def load_pcap(self, filepath: str) -> "PacketAnalyzer":
        """
        Load packets from an existing .pcap / .pcapng file instead of
        capturing live traffic.

        Args:
            filepath: Path to the .pcap file.

        Returns:
            The PacketAnalyzer populated with every packet in the file.
        """
        print(f"[*] Loading packets from: {filepath}")
        packets = rdpcap(filepath)
        for pkt in packets:
            self._process_packet(pkt)
        print(f"[*] Loaded {self.analyzer.get_packet_count()} packets.")
        return self.analyzer

    def save_pcap(self, filepath: str) -> None:
        """
        Save the raw packets that have been captured to a .pcap file.

        Note: raw packets are only available when captured via start();
        packets loaded with load_pcap() are already stored in the analyzer.
        """
        if not self._raw_packets:
            print("[!] No raw packets to save.")
            return
        wrpcap(filepath, self._raw_packets)
        print(f"[*] Saved {len(self._raw_packets)} packets to {filepath}")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _process_packet(self, packet) -> None:
        """Callback executed for every captured packet."""
        record = self._build_record(packet)
        if record:
            self.analyzer.add_record(record)

    @staticmethod
    def _build_record(packet) -> dict | None:
        """
        Extract the most useful fields from a raw Scapy packet and return
        a flat dict that the Analyzer can store as a PacketRecord.

        Returns None for packets without an IP layer (e.g. ARP-only frames).
        """
        if not packet.haslayer(IP):
            return None

        ip = packet[IP]
        record = {
            "timestamp": float(time.time()),
            "src_ip":    ip.src,
            "dst_ip":    ip.dst,
            "protocol":  ip.proto,       # numeric: 6=TCP, 17=UDP, 1=ICMP …
            "length":    len(packet),
            "src_port":  None,
            "dst_port":  None,
            "flags":     None,
        }

        if packet.haslayer(TCP):
            tcp = packet[TCP]
            record["src_port"] = tcp.sport
            record["dst_port"] = tcp.dport
            record["flags"]    = str(tcp.flags)
            record["protocol_name"] = "TCP"

        elif packet.haslayer(UDP):
            udp = packet[UDP]
            record["src_port"] = udp.sport
            record["dst_port"] = udp.dport
            record["protocol_name"] = "UDP"

        elif packet.haslayer(ICMP):
            record["protocol_name"] = "ICMP"

        else:
            record["protocol_name"] = f"PROTO_{ip.proto}"

        return record


# ---------------------------------------------------------------------------
# Quick CLI usage
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    import json
    from statistics import NetworkStatistics

    # Usage: python sniffer.py [pcap_file | interface] [count]
    if len(sys.argv) >= 2 and sys.argv[1].endswith(".pcap"):
        sniffer = PacketSniffer()
        analyzer = sniffer.load_pcap(sys.argv[1])
    else:
        iface = sys.argv[1] if len(sys.argv) >= 2 else None
        count = int(sys.argv[2]) if len(sys.argv) >= 3 else 50
        sniffer = PacketSniffer(interface=iface, packet_count=count)
        analyzer = sniffer.start()

    stats = NetworkStatistics(analyzer)
    report = {
        "packet_count":   stats.get_packet_count(),
        "protocol_stats": stats.get_protocol_stats(),
        "top_ports":      stats.get_top_ports(5),
        "top_src_ips":    stats.get_top_ips(5, direction="src"),
        "top_dst_ips":    stats.get_top_ips(5, direction="dst"),
    }
    print(json.dumps(report, indent=2))