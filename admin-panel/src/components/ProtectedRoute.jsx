import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, hasRole, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="access-denied">
        <div className="access-content">
          <div className="access-icon">⚠️</div>
          <h1>Acceso Denegado</h1>
          <p>No tienes permisos suficientes para acceder a esta página.</p>
          <div className="access-info">
            <p>Tu rol actual: <span className="current-role">{user?.rol}</span></p>
            <p>Roles requeridos: <span className="required-roles">{requiredRoles?.join(', ')}</span></p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
