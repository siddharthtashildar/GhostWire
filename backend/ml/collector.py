import csv
import os
from datetime import datetime

CSV_PATH = "ml/datasets/traffic.csv"


def save_snapshot(snapshot: dict):
    os.makedirs("ml/datasets", exist_ok=True)

    row = snapshot.copy()
    row["timestamp"] = datetime.now().isoformat()

    file_exists = os.path.exists(CSV_PATH)

    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=row.keys()
        )

        if not file_exists:
            writer.writeheader()

        writer.writerow(row)