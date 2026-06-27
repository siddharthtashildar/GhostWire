import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
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
download = pd.read_csv("./datasets/firstSnapshot/downloading.csv", names=columns)
discord = pd.read_csv("./datasets/firstSnapshot/discordCall.csv", names=columns)
coding = pd.read_csv("./datasets/firstSnapshot/coding.csv", names=columns)
idle = pd.read_csv("./datasets/firstSnapshot/idle.csv", names=columns)

browsing["label"] = "Web Browsing"
youtube["label"] = "Media Streaming"
download["label"] = "Large Download"
discord["label"] = "Real-Time Communication"
coding["label"] = "Development"
idle["label"] = "Idle"

df = pd.concat([browsing, youtube, download, discord, coding, idle], ignore_index=True)

print(df["label"].value_counts())
print(df.columns)
X = df.drop(
    columns=[
        "timestamp",
        "label"
    ]
)

y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)

print(
    "Accuracy:",
    accuracy_score(y_test, predictions)
)

print(
    classification_report(
        y_test,
        predictions
    )
)

print(confusion_matrix(y_test, predictions))

importance = pd.DataFrame({
    "feature": X.columns,
    "importance": model.feature_importances_
})

print(
    importance.sort_values(
        by="importance",
        ascending=False
    )
)

joblib.dump(
    model,
    "./models/traffic_classifier.pkl"
)

joblib.dump(
    scaler,
    "./models/scaler.pkl"
)

sample = [[
    300,
    10,
    15,
    20,
    0.60,
    0.30,
    0.10,
    350,
    0.10,
    0.50,
    0.03
]]


sample = scaler.transform(sample)

print(model.predict(sample))