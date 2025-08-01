import ping from "ping";

const target = "8.8.8.8"; // target server IP
const interval = 1000; // ms
const maxHistory = 10000;

let stats = []; // in-memory history

export function startPing() {
  setInterval(async () => {
    const res = await ping.promise.probe(target, {
      timeout: 1,
    });

    stats.push({
      time: Date.now(),
      alive: res.alive,
      latency: res.time === "unknown" ? null : parseFloat(res.time),
    });

    if (stats.length > maxHistory) {
      stats.shift(); // keep size under control
    }
  }, interval);
}

export function getStats() {
  const total = stats.length;
  const lost = stats.filter((r) => !r.alive).length;
  return {
    target,
    total,
    lost,
    lossRate: total ? (lost / total) * 100 : 0,
    data: stats,
  };
}
