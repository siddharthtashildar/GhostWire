import { useEffect, useState } from "react";



export function useAI() {
    const [data, setData] = useState({
        activity: "No data available",
        confidence: 0,
        threat_score: 0,
        summary: {
            status: "No status available",
            findings: ["No findings available"]
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(
                "http://localhost:8000/ml/analysis"
            )

            setData(await res.json())
        }

        fetchData()

        const interval = setInterval(
            fetchData,
            5000
        )

        return () => clearInterval(interval)
    }, [])

    return data
}