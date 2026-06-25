"""
analyzer.py — Packet data extraction and storage module.

Defines:
  • PacketRecord  – lightweight dataclass wrapping a single captured packet
  • PacketAnalyzer – stores records and provides query helpers for statistics.py
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# PacketRecord — one captured packet
# ---------------------------------------------------------------------------



@dataclass
class PacketRecord:
    """
    Immutable representation of a single network packet.

    All fields are populated by PacketSniffer._build_record(); fields that
    cannot be determined (e.g. ports on an ICMP packet) are None.
    """

    # Layer 3
    src_ip:        str
    dst_ip:        str
    protocol:      int            # raw IP protocol number
    protocol_name: str            # human-readable: TCP / UDP / ICMP / PROTO_N
    length:        int            # total packet length in bytes

    # Layer 4 (TCP / UDP only)
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    flags:    Optional[str] = None   # TCP flags as string, e.g. "SA"

    # Timing
    timestamp: float = field(default_factory=time.time)

    # ------------------------------------------------------------------
    # Convenience properties
    # ------------------------------------------------------------------

    @property
    def is_tcp(self) -> bool:
        return self.protocol_name == "TCP"

    @property
    def is_udp(self) -> bool:
        return self.protocol_name == "UDP"

    @property
    def is_icmp(self) -> bool:
        return self.protocol_name == "ICMP"

    @property
    def has_ports(self) -> bool:
        return self.src_port is not None and self.dst_port is not None

    def to_dict(self) -> dict:
        """Serialize to a plain dict (useful for JSON export)."""
        return {
            "timestamp":     self.timestamp,
            "src_ip":        self.src_ip,
            "dst_ip":        self.dst_ip,
            "protocol":      self.protocol,
            "protocol_name": self.protocol_name,
            "length":        self.length,
            "src_port":      self.src_port,
            "dst_port":      self.dst_port,
            "flags":         self.flags,
        }

    def __repr__(self) -> str:
        port_info = ""
        if self.has_ports:
            port_info = f":{self.src_port} → :{self.dst_port} "
        return (
            f"<PacketRecord {self.protocol_name} "
            f"{self.src_ip}{port_info}→ {self.dst_ip} "
            f"len={self.length}>"
        )


# ---------------------------------------------------------------------------
# PacketAnalyzer — record store + raw query helpers
# ---------------------------------------------------------------------------

class PacketAnalyzer:
    """
    Stores PacketRecord objects and exposes low-level access methods that
    statistics.py builds upon.

    Design contract
    ---------------
    • PacketAnalyzer owns the canonical list of records.
    • It performs *no* aggregation — that is NetworkStatistics' job.
    • All public methods return plain Python types (lists, dicts, ints)
      so that statistics.py has no dependency on Scapy.
    """

    def __init__(self) -> None:
        self._records: List[PacketRecord] = []

    # ------------------------------------------------------------------
    # Write API (used by PacketSniffer)
    # ------------------------------------------------------------------

    def add_record(self, data: dict) -> PacketRecord:
        """
        Create a PacketRecord from a raw dict produced by
        PacketSniffer._build_record() and append it to the internal list.

        Args:
            data: Dict with keys matching PacketRecord fields.

        Returns:
            The newly created PacketRecord.
        """
        record = PacketRecord(
            src_ip        = data["src_ip"],
            dst_ip        = data["dst_ip"],
            protocol      = data["protocol"],
            protocol_name = data.get("protocol_name", f"PROTO_{data['protocol']}"),
            length        = data["length"],
            src_port      = data.get("src_port"),
            dst_port      = data.get("dst_port"),
            flags         = data.get("flags"),
            timestamp     = data.get("timestamp", time.time()),
        )
        self._records.append(record)
        # if len(self._records) > MAX_RECORDS:
        #     self._records.pop(0)
        return record

    # ------------------------------------------------------------------
    # Read API (used by NetworkStatistics)
    # ------------------------------------------------------------------

    def get_all_records(self) -> List[PacketRecord]:
        """Return a shallow copy of all stored PacketRecord objects."""
        return list(self._records)

    def get_packet_count(self) -> int:
        """Return total number of stored packets."""
        return len(self._records)

    def get_records_by_protocol(self, protocol_name: str) -> List[PacketRecord]:
        """
        Filter records by protocol name (case-insensitive).

        Args:
            protocol_name: e.g. 'TCP', 'UDP', 'ICMP'
        """
        name = protocol_name.upper()
        return [r for r in self._records if r.protocol_name.upper() == name]

    def get_records_by_ip(
        self,
        ip: str,
        direction: str = "both",
    ) -> List[PacketRecord]:
        """
        Filter records by IP address.

        Args:
            ip:        IPv4 address string.
            direction: 'src' | 'dst' | 'both'
        """
        if direction == "src":
            return [r for r in self._records if r.src_ip == ip]
        elif direction == "dst":
            return [r for r in self._records if r.dst_ip == ip]
        else:
            return [r for r in self._records if r.src_ip == ip or r.dst_ip == ip]

    def get_records_by_port(self, port: int) -> List[PacketRecord]:
        """Return all records where src or dst port matches."""
        return [
            r for r in self._records
            if r.src_port == port or r.dst_port == port
        ]

    def get_records_in_timerange(
        self,
        start: float,
        end: float,
    ) -> List[PacketRecord]:
        """
        Return records whose timestamp falls within [start, end].

        Args:
            start: Unix timestamp (float).
            end:   Unix timestamp (float).
        """
        return [r for r in self._records if start <= r.timestamp <= end]

    def get_unique_src_ips(self) -> List[str]:
        """Return sorted list of unique source IPs."""
        return sorted({r.src_ip for r in self._records})

    def get_unique_dst_ips(self) -> List[str]:
        """Return sorted list of unique destination IPs."""
        return sorted({r.dst_ip for r in self._records})

    def get_unique_protocols(self) -> List[str]:
        """Return sorted list of unique protocol names seen."""
        return sorted({r.protocol_name for r in self._records})

    def get_total_bytes(self) -> int:
        """Return sum of all packet lengths in bytes."""
        return sum(r.length for r in self._records)

    def export_to_dicts(self) -> List[dict]:
        """Serialize all records to a list of plain dicts (for JSON export)."""
        return [r.to_dict() for r in self._records]

    def clear(self) -> None:
        """Remove all stored records."""
        self._records.clear()

    def __len__(self) -> int:
        return len(self._records)

    def __repr__(self) -> str:
        return f"<PacketAnalyzer records={len(self._records)}>"