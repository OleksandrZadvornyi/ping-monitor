import { Line } from "react-chartjs-2";
import { useState } from "react";
import StatsPanel from "./StatsPanel";
import { useLatencyData } from "../hooks/useLatencyData";

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
  const { dataPoints, stats, loading, error, changeTarget } = useLatencyData();

  // Local UI state (not related to data fetching)
  const [viewRange, setViewRange] = useState(300); // default to 5 min
  const [inputTarget, setInputTarget] = useState("");

  // Handle target change with the hook's function
  const handleTargetChange = async () => {
    const success = await changeTarget(inputTarget);
    if (success) {
      setInputTarget(""); // Clear input on success
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <div>Loading latency data...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <div style={{ color: "red" }}>Error: {error}</div>
      </div>
    );
  }

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
    return annotations;
  })();

  // Ping quality background zones
  const pingQualityAnnotations = {
    // Good ping zone (0-100ms) - Green
    goodPingZone: {
      type: "box",
      yMin: 0,
      yMax: 100,
      backgroundColor: "rgba(76, 175, 80, 0.1)",
      borderWidth: 0,
      z: -1,
    },
    // Fair ping zone (100-200ms) - Yellow
    fairPingZone: {
      type: "box",
      yMin: 100,
      yMax: 200,
      backgroundColor: "rgba(255, 193, 7, 0.1)",
      borderWidth: 0,
      z: -1,
    },
    // Poor ping zone (200ms+) - Red
    poorPingZone: {
      type: "box",
      yMin: 200,
      yMax: "max",
      backgroundColor: "rgba(244, 67, 54, 0.1)",
      borderWidth: 0,
      z: -1,
    },
  };

  // Combine all annotations
  const allAnnotations = {
    ...pingQualityAnnotations,
    ...lostPacketAnnotations,
  };

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
        suggestedMax: 50,
      },
    },
    animation: false,
    plugins: {
      legend: { display: true },
      annotation: {
        annotations: allAnnotations,
      },
      tooltip: {
        callbacks: {
          afterLabel: function (context) {
            const ping = context.parsed.y;
            if (ping === null) return null;
            if (ping <= 100) return "Quality: Good";
            else if (ping <= 200) return "Quality: Fair";
            else return "Quality: Poor";
          },
        },
      },
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
