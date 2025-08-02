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
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  annotationPlugin
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
  const [target, setTarget] = useState("");
  const [inputTarget, setInputTarget] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataRes, targetRes] = await Promise.all([
          fetch("http://localhost:3001/data"),
          fetch("http://localhost:3001/target"),
        ]);
        const dataJson = await dataRes.json();
        const targetJson = await targetRes.json();

        setDataPoints(dataJson.data);
        setTarget(targetJson.target);

        setStats({
          total: dataJson.total,
          lost: dataJson.lost,
          lossRate: dataJson.lossRate.toFixed(2),
          target: targetJson.target,
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

  const labels = filteredData.map((dp) =>
    new Date(dp.time).toLocaleTimeString("en-GB")
  );
  const latencyData = filteredData.map((dp) =>
    dp.latency !== null ? dp.latency : null
  );

  // Find consecutive groups of lost packets and create rectangle annotations
  const lostPacketAnnotations = (() => {
    const lostIndices = [];
    for (let i = 0; i < filteredData.length; i++) {
      if (filteredData[i].latency === null) {
        lostIndices.push(i);
      }
    }
    if (lostIndices.length === 0) return {};

    // Group consecutive lost packets
    const groups = [];
    let currentGroup = [lostIndices[0]];

    for (let i = 1; i < lostIndices.length; i++) {
      if (lostIndices[i] === lostIndices[i - 1] + 1) {
        // Consecutive lost packet
        currentGroup.push(lostIndices[i]);
      } else {
        // Gap found, start new group
        groups.push(currentGroup);
        currentGroup = [lostIndices[i]];
      }
    }
    groups.push(currentGroup); // Add the last group

    // Create annotations for each group
    const annotations = {};
    groups.forEach((group, groupIndex) => {
      const startIndex = group[0];
      const endIndex = group[group.length - 1];

      // Create rectangles to fill the entire gap
      // From the end of the last successful packet to the start of the next successful packet
      annotations[`lostPacketGroup${groupIndex}`] = {
        type: "box",
        xMin: startIndex - 1,
        xMax: endIndex + 1,
        yMin: 0,
        yMax: "max",
        backgroundColor: "rgba(255, 99, 99, 0.5)",
        borderWidth: 0,
        label: {
          content: "Packet Lost",
          enabled: false,
        },
      };
    });
    console.log("Lost Packet Annotations:", annotations);
    return annotations;
  })();

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
    labels,
    datasets: [
      {
        label: "Latency (ms)",
        data: latencyData,
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
        spanGaps: false, // Don't connect points across gaps
        pointRadius: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false, // Hide vertical grid lines
        },
        ticks: {
          maxTicksLimit: 10, // Show maximum 10 labels
        },
      },
      y: {
        title: { display: true, text: "Latency (ms)" },
        suggestedMin: 0,
        suggestedMax: 200,
      },
    },
    animation: false,
    plugins: {
      legend: { display: true },
      annotation: {
        annotations: lostPacketAnnotations,
      },
    },
  };

  const handleTargetChange = async () => {
    if (!inputTarget.trim()) return;
    try {
      const res = await fetch("http://localhost:3001/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: inputTarget.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setTarget(json.target);
        setInputTarget("");
      }
    } catch (err) {
      console.error("Failed to update target:", err);
    }
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
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter IP or domain"
          value={inputTarget}
          onChange={(e) => setInputTarget(e.target.value)}
          style={{ padding: "0.5rem", width: "200px" }}
        />
        <button
          onClick={handleTargetChange}
          style={{
            marginLeft: "0.5rem",
            padding: "0.5rem 1rem",
            background: "#0077cc",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Change Target
        </button>
      </div>
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
