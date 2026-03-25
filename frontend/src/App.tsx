import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AuthorDashboard from './pages/AuthorDashboard';
import ChairDashboard from './pages/ChairDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/author" element={<AuthorDashboard />} />
      <Route path="/chair" element={<ChairDashboard />} />
    </Routes>
  );
}
