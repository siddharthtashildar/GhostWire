import joblib

model = joblib.load(
    "ml/models/traffic_classifier.pkl"
)

scaler = joblib.load(
    "ml/models/scaler.pkl"
)

FEATURES = [
    "packet_count",
    "pps",
    "unique_ips",
    "unique_ports",
    "tcp_ratio",
    "udp_ratio",
    "icmp_ratio",
    "avg_packet_size",
    "dns_ratio",
    "https_ratio",
    "syn_ratio",
]


def predict(snapshot):
    values = [[snapshot[f] for f in FEATURES]]

    values = scaler.transform(values)

    prediction = model.predict(values)[0]

    confidence = max(
        model.predict_proba(values)[0]
    )

    return {
        "activity": prediction,
        "confidence": round(confidence * 100, 2),
    }