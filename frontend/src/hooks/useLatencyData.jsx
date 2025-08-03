import { useState, useEffect } from "react";

export function useLatencyData() {
  const [dataPoints, setDataPoints] = useState([]);
  const [stats, setStats] = useState(null);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      setError(null); // Clear any previous errors

      const [dataRes, targetRes] = await Promise.all([
        fetch("http://localhost:3001/data"),
        fetch("http://localhost:3001/target"),
      ]);

      if (!dataRes.ok || !targetRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const dataJson = await dataRes.json();
      const targetJson = await targetRes.json();

      setDataPoints(dataJson.data);

      setStats({
        total: dataJson.total,
        lost: dataJson.lost,
        lossRate: dataJson.lossRate.toFixed(2),
        target: targetJson.target,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching latency data:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Function to change target
  const changeTarget = async (newTarget) => {
    if (!newTarget.trim()) return false;

    try {
      setError(null);
      const res = await fetch("http://localhost:3001/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: newTarget.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to update target");
      }

      const json = await res.json();
      if (json.success) {
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update target:", err);
      setError(err.message);
      return false;
    }
  };

  // Set up polling effect
  useEffect(() => {
    fetchData(); // Initial fetch

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  // Return all the data and functions the component needs
  return {
    dataPoints,
    stats,
    loading,
    error,
    changeTarget,
  };
}
