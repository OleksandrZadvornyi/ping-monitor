import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import StatsPanel from "./StatsPanel";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const RANGE_OPTIONS = [
  { label: "60s", value: 60 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
  { label: "30m", value: 1800 },
  { label: "1h", value: 3600 },
  { label: "2h", value: 7200 },
  { label: "All", value: Infinity },
];

export default function LatencyGraph() {
  const [dataPoints, setDataPoints] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewRange, setViewRange] = useState(300); // default to 5 min

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/data");
        const json = await res.json();
        setDataPoints(json.data);
        setStats({
          total: json.total,
          lost: json.lost,
          lossRate: json.lossRate.toFixed(2),
          target: json.target,
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const filteredData = dataPoints.filter((dp) =>
    viewRange === Infinity ? true : now - dp.time <= viewRange * 1000
  );

  const validLatencies = filteredData
    .map((dp) => dp.latency)
    .filter((latency) => latency !== null);

  const latencyStats = {
    current: validLatencies.at(-1) ?? "N/A",
    avg: validLatencies.length
      ? (
          validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length
        ).toFixed(1)
      : "N/A",
    min: validLatencies.length ? Math.min(...validLatencies) : "N/A",
    max: validLatencies.length ? Math.max(...validLatencies) : "N/A",
  };

  const chartData = {
    labels: filteredData.map((dp) => new Date(dp.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Latency (ms)",
        data: filteredData.map((dp) =>
          dp.latency !== null ? dp.latency : null
        ),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // allow stretching
    scales: {
      y: {
        title: { display: true, text: "Latency (ms)" },
        suggestedMin: 0,
        suggestedMax: 200,
      },
    },
    animation: false,
    plugins: {
      legend: { display: true },
    },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      <StatsPanel stats={stats} latencyStats={latencyStats} />
      <label style={{ marginBottom: "1rem", display: "block" }}>
        View Range:&nbsp;
        <select
          value={viewRange}
          onChange={(e) => setViewRange(Number(e.target.value))}
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <div style={{ flexGrow: 1, overflow: "hidden" }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
