import ping from "ping";

let target = "8.8.8.8";
const interval = 1000; // ms
const maxHistory = 10000;
let stats = [];
let intervalId = null;

function pingLoop() {
  intervalId = setInterval(async () => {
    const res = await ping.promise.probe(target, { timeout: 1 });

    stats.push({
      time: Date.now(),
      alive: res.alive,
      latency: res.time === "unknown" ? null : parseFloat(res.time),
    });

    if (stats.length > maxHistory) {
      stats.shift();
    }
  }, interval);
}

export function startPing() {
  if (!intervalId) pingLoop();
}

export function setTarget(newTarget) {
  target = newTarget;
  stats = []; // clear history
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    pingLoop();
  }
}

export function getTarget() {
  return target;
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
