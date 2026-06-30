def generate_summary(
    activity,
    confidence,
    threat_score,
    snapshot,
):
    findings = []

    pps = snapshot["pps"]
    syn_ratio = snapshot["syn_ratio"]
    unique_ips = snapshot["unique_ips"]

    # Activity
    findings.append(
        f"{activity} activity detected."
    )

    # Threat level
    if threat_score < 30:
        status = "Normal"

        findings.append(
            "Traffic matches learned behavior."
        )

    elif threat_score < 70:
        status = "Warning"

        findings.append(
            "Traffic differs slightly from normal patterns."
        )

    else:
        status = "Suspicious"

        findings.append(
            "Unusual traffic behavior detected."
        )

    # Packet rate
    if pps > 100:
        findings.append(
            "High packet rate observed."
        )
    else:
        findings.append(
            "Packet rate is within expected limits."
        )

    # SYN traffic
    if syn_ratio > 0.2:
        findings.append(
            "Elevated SYN traffic detected."
        )

    # Host count
    if unique_ips > 50:
        findings.append(
            "Multiple hosts are active."
        )

    return {
        "findings": findings,
        "status": status,
    }