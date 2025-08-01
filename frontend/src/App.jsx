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
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <img
          src="./icon-default.png"
          alt="Logo"
          style={{ width: 48, height: 48, marginRight: '1rem', borderRadius: '20%' }}
        />
        <h1 style={{ margin: 0 }}>Ping Monitor</h1>
      </div>
      <LatencyGraph />
    </div>
  );
}

export default App;
