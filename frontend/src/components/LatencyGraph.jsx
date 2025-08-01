import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import StatsPanel from './StatsPanel';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function LatencyGraph() {
  const [dataPoints, setDataPoints] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3001/data');
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

  const validLatencies = dataPoints
    .map(dp => dp.latency)
    .filter(latency => latency !== null);

  const latencyStats = {
    current: validLatencies.at(-1) ?? 'N/A',
    avg: validLatencies.length
      ? (validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length).toFixed(1)
      : 'N/A',
    min: validLatencies.length ? Math.min(...validLatencies) : 'N/A',
    max: validLatencies.length ? Math.max(...validLatencies) : 'N/A',
  };

  const chartData = {
    labels: dataPoints.map(dp => new Date(dp.time).toLocaleTimeString()),
    datasets: [
      {
        label: 'Latency (ms)',
        data: dataPoints.map(dp => (dp.latency !== null ? dp.latency : null)),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // allow stretching
    scales: {
      y: {
        title: { display: true, text: 'Latency (ms)' },
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
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
      <StatsPanel stats={stats} latencyStats={latencyStats} />
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        <Line data={chartData} options={chartOptions}  />
      </div>
    </div>
  );
}
