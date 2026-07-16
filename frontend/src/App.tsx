import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ComparePage } from './pages/ComparePage';
import { DashboardPage } from './pages/DashboardPage';
import { InstallPage } from './pages/InstallPage';
import { JobDetailPage } from './pages/JobDetailPage';


export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/products/:id/compare" element={<ComparePage />} />
      </Route>
    </Routes>
  );
}