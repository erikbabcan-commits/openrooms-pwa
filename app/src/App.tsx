import { Routes, Route, Navigate } from 'react-router-dom';
import JoinScreen from './routes/JoinScreen';
import Room from './routes/Room';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<JoinScreen />} />
        <Route path="/room/:name" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
