import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['Administrador', 'Guardia'] },
    { name: 'Usuarios', path: '/usuarios', icon: '👥', roles: ['Administrador'] },
    { name: 'Zonas', path: '/zonas', icon: '📍', roles: ['Administrador', 'Guardia'] },
    { name: 'Alertas', path: '/alertas', icon: '🚨', roles: ['Administrador', 'Guardia', 'Estudiante', 'Docente'] },
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.roles));

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-title">
            <span className="sidebar-icon">🛡️</span>
            <div>
              <h3>Panel UTA</h3>
              <p>Sistema de Seguridad</p>
            </div>
          </div>
        )}
        {isCollapsed && <span className="sidebar-icon">🛡️</span>}
        
        <button 
          className="toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      <div className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-text">{item.name}</span>}
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="user-info">
            <div className="user-avatar">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.nombre || 'Usuario'}</div>
              <div className="user-role">{user?.rol || 'Sin rol'}</div>
            </div>
          </div>
        )}
        
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
