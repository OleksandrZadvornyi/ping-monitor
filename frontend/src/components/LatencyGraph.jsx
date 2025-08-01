import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3001/data');
        const json = await res.json();
        setDataPoints(json.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div>
      <h2>Live Latency</h2>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
