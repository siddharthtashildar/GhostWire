const API_URL = "http://localhost:8000";

export async function getPacketCount() {
  const res = await fetch(`${API_URL}/stats/count`);

  if (!res.ok) {
    throw new Error("Failed to fetch packet count");
  }

  return res.json();
}

export async function getProtocols() {
  const res = await fetch(`${API_URL}/stats/protocols`);

  if (!res.ok) {
    throw new Error("Failed to fetch protocols");
  }

  return res.json();
}

export async function getTopPorts() {
  const res = await fetch(`${API_URL}/stats/top-ports`);

  if (!res.ok) {
    throw new Error("Failed to fetch top ports");
  }

  return res.json();
}


async function fetchJson(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return res.json();
}

export async function startCapture(config: {
  interface?: string;
  packet_count?: number;
  timeout?: number;
}) {
  const res = await fetch(`${API_URL}/capture/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    throw new Error("Failed to start capture");
  }

  return res.json();
}

export async function stopCapture() {
  const res = await fetch(`${API_URL}/capture/stop`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to stop capture");
  }

  return res.json();
}

export async function getCaptureStatus() {
  return fetchJson(`/capture/status`);
}

export async function getTopIps(n: number = 5, direction: string = "src") {
  return fetchJson(`/stats/top-ips?n=${n}&direction=${direction}`);
}

export async function getBandwidth() {
  return fetchJson(`/stats/bandwidth`);
}

export async function getSummary(topN: number = 5) {
  return fetchJson(`/stats/summary?top_n=${topN}`);
}