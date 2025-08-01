export default function StatsPanel({ stats, latencyStats }) {
  if (!stats || !latencyStats) return null;

  const { target, total, lost, lossRate } = stats;

  const { current, avg, min, max } = latencyStats;

  const itemStyle = {
    minWidth: "120px",
    marginRight: "1rem",
    marginBottom: "0.5rem",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={itemStyle}>
        <strong>Target:</strong> {target}
      </div>
      <div style={itemStyle}>
        <strong>Current:</strong> {current} ms
      </div>
      <div style={itemStyle}>
        <strong>Avg:</strong> {avg} ms
      </div>
      <div style={itemStyle}>
        <strong>Min:</strong> {min} ms
      </div>
      <div style={itemStyle}>
        <strong>Max:</strong> {max} ms
      </div>
      <div style={itemStyle}>
        <strong>Total:</strong> {total}
      </div>
      <div style={itemStyle}>
        <strong>Lost:</strong> {lost}
      </div>
      <div style={itemStyle}>
        <strong>Loss %:</strong> {lossRate}%
      </div>
    </div>
  );
}
