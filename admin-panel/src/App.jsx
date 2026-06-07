import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Zonas from './pages/Zonas';
import Alertas from './pages/Alertas';
import Dashboard from './pages/Dashboard';
import GruposConfianza from './pages/GruposConfianza';
import { adminWsService } from './services/wsService';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const rol = userRaw ? JSON.parse(userRaw)?.rol : null;

    if (token && rol === 'Administrador') {
      adminWsService.connect(token);
    }

    return () => adminWsService.disconnect();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="usuarios" element={
              <ProtectedRoute requiredRoles={['Administrador']}>
                <Usuarios />
              </ProtectedRoute>
            } />
            <Route path="zonas" element={<Zonas />} />
            <Route path="grupos-confianza" element={
              <ProtectedRoute requiredRoles={['Administrador']}>
                <GruposConfianza />
              </ProtectedRoute>
            } />
            <Route path="alertas" element={<Alertas />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;