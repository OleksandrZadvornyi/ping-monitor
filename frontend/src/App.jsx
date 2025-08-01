import LatencyGraph from './components/LatencyGraph';
import './index.css'; 

function App() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      boxSizing: 'border-box',
      overflow: 'hidden', // prevent vertical scrollbar
    }}>
      <h1 style={{ margin: 0 }}>Ping Monitor</h1>
      <LatencyGraph />
    </div>
  );
}

export default App;
