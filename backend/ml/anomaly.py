import joblib

model = joblib.load(
    "ml/models/anomaly_detector.pkl"
)

scaler = joblib.load(
    "ml/models/anomaly_scaler.pkl"
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


def predict_anomaly(snapshot):

    values = [[
        snapshot[f]
        for f in FEATURES
    ]]

    values = scaler.transform(values)

    prediction = model.predict(values)[0]

    score = float(
        model.decision_function(values)[0]
    )

    threat_score = max(
        0,
        min(
            100,
            int((0.2 - score) * 250)
        )
    )

    return {
        "anomaly": bool(prediction == -1),
        "score": float(round(score, 4)),
        "threat_score": int(threat_score),
    }

# sample = {
#     "packet_count": 50000,
#     "pps": 900,
#     "unique_ips": 300,
#     "unique_ports": 350,
#     "tcp_ratio": 0.95,
#     "udp_ratio": 0.03,
#     "icmp_ratio": 0.02,
#     "avg_packet_size": 800,
#     "dns_ratio": 0.01,
#     "https_ratio": 0.99,
#     "syn_ratio": 0.02,
# }

# print(
#     predict_anomaly(sample)
# )