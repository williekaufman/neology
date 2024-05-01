import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GamePage from './GamePage';
import LobbyPage from './LobbyPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/game/:id" element={<GamePage />} />
      </Routes>
    </Router>
  )
}

export default App;
