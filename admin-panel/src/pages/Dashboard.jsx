import { useState, useEffect, useRef } from 'react';
import { getDashboardData } from '../services/dashboardService';
import DashboardCounters from '../components/DashboardCounters';
import DashboardCharts from '../components/DashboardCharts';
import DashboardActivity from '../components/DashboardActivity';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const isMounted = useRef(true);

 useEffect(() => {
  isMounted.current = true;
  cargarDatosDashboard(true); // ← corregir esto
  
  const interval = setInterval(() => {
    cargarDatosDashboard(false);
  }, 10000);

  return () => {
    isMounted.current = false;
    clearInterval(interval);
  };
}, []);

 const cargarDatosDashboard = async (esCargaInicial = false) => {
  if (!isMounted.current) return;

  if (esCargaInicial) setLoading(true);
  else setRefreshing(true);

  try {
    const resultado = await getDashboardData();

    if (!isMounted.current) return;

    if (resultado.success) {
      // ← Solo actualiza si los datos rcargarDatoealmente cambiaron
      setDashboardData(prev => {
        const prevStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(resultado.data);
        if (prevStr === nextStr) return prev; // mismo objeto, React no re-renderiza
        return resultado.data;
      });
      setError('');
      setUltimaActualizacion(new Date());
    } else {
      setError(resultado.error);
    }
  } catch (err) {
    if (isMounted.current) setError('Error al cargar los datos del dashboard');
  } finally {
    if (isMounted.current) {
      setLoading(false);
      setRefreshing(false);
    }
  }
};

  const formatUltimaActualizacion = (fecha) => {
    const diffSegundos = Math.floor((new Date() - fecha) / 1000);
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
          <span className={`actualizacion-indicator ${refreshing ? 'refrescando' : ''}`}>🔄</span>
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

      <div className="dashboard-section">
        <h2>Resumen General</h2>
        <DashboardCounters data={dashboardData} />
      </div>

      <div className="dashboard-section">
        <h2>Estadísticas</h2>
        {/* datos ya vienen dentro de dashboardData.estadisticas */}
        <DashboardCharts data={dashboardData.estadisticas || {}} />
      </div>

      <div className="dashboard-section">
        <h2>Actividad Reciente</h2>
        {/* actividades también vienen en dashboardData */}
        <DashboardActivity actividades={dashboardData.actividades || []} />
      </div>
    </div>
  );
};

export default Dashboard;