import { useState, useEffect } from 'react';
import { getDashboardData, getAlertasEstadisticas, getActividadReciente } from '../services/dashboardService';
import DashboardCounters from '../components/DashboardCounters';
import DashboardCharts from '../components/DashboardCharts';
import DashboardActivity from '../components/DashboardActivity';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({});
  const [estadisticas, setEstadisticas] = useState({});
  const [actividadReciente, setActividadReciente] = useState([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  useEffect(() => {
    cargarDatosDashboard();
    
    // Configurar actualización automática cada 10 segundos
    const interval = setInterval(() => {
      cargarDatosDashboard();
      setUltimaActualizacion(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const cargarDatosDashboard = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar datos principales
      const resultadoDashboard = await getDashboardData();
      
      if (resultadoDashboard.success) {
        setDashboardData(resultadoDashboard.data);
      } else {
        setError(resultadoDashboard.error);
      }

      // Cargar estadísticas adicionales
      const resultadoEstadisticas = await getAlertasEstadisticas('7d');
      
      if (resultadoEstadisticas.success) {
        setEstadisticas(resultadoEstadisticas.data);
      }

      // Cargar actividad reciente
      const resultadoActividad = await getActividadReciente(10);
      
      if (resultadoActividad.success) {
        setActividadReciente(resultadoActividad.data);
      }

    } catch (err) {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatUltimaActualizacion = (fecha) => {
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffSegundos = Math.floor(diffMs / 1000);
    
    if (diffSegundos < 60) return 'Justo ahora';
    if (diffSegundos < 3600) return `Hace ${Math.floor(diffSegundos / 60)} min`;
    return `Hace ${Math.floor(diffSegundos / 3600)} h`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="ultima-actualizacion">
          <span className="actualizacion-indicator">🔄</span>
          <span className="actualizacion-texto">
            Última actualización: {formatUltimaActualizacion(ultimaActualizacion)}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Contadores */}
      <div className="dashboard-section">
        <h2>Resumen General</h2>
        <DashboardCounters data={dashboardData} />
      </div>

      {/* Gráficos */}
      <div className="dashboard-section">
        <h2>Estadísticas</h2>
       <DashboardCharts data={dashboardData.estadisticas || estadisticas} />
      </div>

      {/* Actividad Reciente */}
      <div className="dashboard-section">
        <h2>Actividad Reciente</h2>
        <DashboardActivity actividades={actividadReciente} />
      </div>
    </div>
  );
};

export default Dashboard;
