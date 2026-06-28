import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

columns = [
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
    "timestamp",
]


browsing = pd.read_csv("./datasets/firstSnapshot/normal_browsing.csv" , names=columns)
youtube = pd.read_csv("./datasets/firstSnapshot/YoutubeAndTwitch.csv", names=columns)
# download = pd.read_csv("./datasets/firstSnapshot/downloading.csv", names=columns)
discord = pd.read_csv("./datasets/firstSnapshot/discordCall.csv", names=columns)
coding = pd.read_csv("./datasets/firstSnapshot/coding.csv", names=columns)
idle = pd.read_csv("./datasets/firstSnapshot/idle.csv", names=columns)


df = pd.concat([browsing, youtube, discord, coding, idle], ignore_index=True)

print(df.columns)

X = df.drop(
    columns=[
        "timestamp"
    ],
    errors="ignore"
)



scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)


model = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42
)

model.fit(X_scaled)

joblib.dump(
    model,
    "./models/anomaly_detector.pkl"
)

joblib.dump(
    scaler,
    "./models/anomaly_scaler.pkl"
)

print("Isolation Forest trained successfully.")

