import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ComparePage } from './pages/ComparePage';
import { DashboardPage } from './pages/DashboardPage';
import { InstallPage } from './pages/InstallPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products/:id/compare" element={<ComparePage />} />
      </Route>
    </Routes>
  );
}