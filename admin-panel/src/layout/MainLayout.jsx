import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div className="main-layout">
      <Sidebar />
      
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <div className="header-left">
              <span className="header-icon">🛡️</span>
              <div className="header-title">
                <h1>Sistema de Seguridad UTA</h1>
                <p>Panel de Administración</p>
              </div>
            </div>

            <div className="header-right">
              <div className="user-info">
                <span className="user-name">{user?.nombre || 'Usuario'}</span>
                <span className="user-role">{user?.rol || 'Sin rol'}</span>
              </div>
              <div className="user-avatar">
                {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
