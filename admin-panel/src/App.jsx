import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';

// Páginas placeholder - se crearán en siguientes tareas
const Dashboard = () => <div>Dashboard - En desarrollo</div>;
const Usuarios = () => <div>Usuarios - En desarrollo</div>;
const Zonas = () => <div>Zonas - En desarrollo</div>;
const Alertas = () => <div>Alertas - En desarrollo</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
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
            <Route path="alertas" element={<Alertas />} />
          </Route>
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
