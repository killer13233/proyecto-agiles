import { useState, useEffect, useRef } from 'react';
import { getDashboardData } from '../services/dashboardService';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import './Dashboard.css';

const COLORS = {
  primary: '#4f8cff', success: '#2ed573', warning: '#ffa502',
  danger: '#ff4757', info: '#17a2b8', purple: '#a855f7', teal: '#14b8a6',
};

const PIE_COLORS = ['#4f8cff', '#7c6cf0', '#2ed573', '#ffa502', '#ff4757', '#a855f7', '#14b8a6', '#ec4899'];

const formatNumber = (num) => new Intl.NumberFormat('es-EC').format(num);

const formatMin = (min) => {
  if (min == null) return '—';
  if (min < 60) return `${min} min`;
  if (min < 1440) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  const d = Math.floor(min / 1440);
  const h = Math.round((min % 1440) / 60);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
};

const formatTime = (timestamp) => {
  const diffMs = new Date() - new Date(timestamp);
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Justo ahora';
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="recharts-custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tooltip-value" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ msg = 'Sin datos disponibles' }) => (
  <div className="chart-empty">
    <span className="chart-empty-icon">&#x1F4CA;</span>
    <p>{msg}</p>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    cargarDatosDashboard(true);
    const interval = setInterval(() => cargarDatosDashboard(false), 10000);
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
        setDashboardData(prev => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(resultado.data);
          if (prevStr === nextStr) return prev;
          return resultado.data;
        });
        setError('');
        setUltimaActualizacion(new Date());
      } else {
        setError(resultado.error);
      }
    } catch {
      if (isMounted.current) setError('Error al cargar los datos del dashboard');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  console.log('[Dashboard] dashboardData recibido:', dashboardData);
  console.log('[Dashboard] estadisticas:', dashboardData.estadisticas);

  const { usuarios = {}, alertas = {}, zonas = {}, estadisticas = {}, actividades = [] } = dashboardData;
  const { alertasPorDia = [], alertasPorTipo = [], alertasPorZona = [], usuariosPorRol = [] } = estadisticas;

  const alertasPorEstado = [
    { name: 'Activas', value: alertas.activas || 0 },
    { name: 'Asignadas', value: alertas.asignadas || 0 },
    { name: 'Cerradas', value: alertas.cerradas || 0 },
  ];

  const usuariosEstado = [
    { name: 'Activos', value: usuarios.activos || 0 },
    { name: 'Inactivos', value: usuarios.inactivos || 0 },
  ];

  const tendenciaAcumulada = alertasPorDia.reduce((acc, d, i) => {
    const prev = i > 0 ? acc[i - 1].total : 0;
    acc.push({ dia: d.dia, total: prev + d.count });
    return acc;
  }, []);

  const formatUltimaActualizacion = (fecha) => {
    const diffSegundos = Math.floor((new Date() - fecha) / 1000);
    if (diffSegundos < 60) return 'Justo ahora';
    if (diffSegundos < 3600) return `Hace ${Math.floor(diffSegundos / 60)} min`;
    return `Hace ${Math.floor(diffSegundos / 3600)} h`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const maxAlertaCount = Math.max(...alertasPorDia.map(d => d.count), 1);
  const tieneAlertas = alertas.total > 0;
  const tieneUsuarios = usuarios.total > 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="ultima-actualizacion">
          <span className={`actualizacion-indicator ${refreshing ? 'refrescando' : ''}`}>&#x1F504;</span>
          <span>Última actualización: {formatUltimaActualizacion(ultimaActualizacion)}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">&#x26A0;&#xFE0F;</span>
          {error}
        </div>
      )}

      {/* Debug info */}
      <details style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>Debug: datos recibidos</summary>
        <div style={{ marginTop: '0.5rem', lineHeight: 1.8 }}>
          <div>alertas.total: {alertas.total ?? 'undefined'}</div>
          <div>alertas.nuevasHoy: {alertas.nuevasHoy ?? 'undefined'}</div>
          <div>alertas.resueltasHoy: {alertas.resueltasHoy ?? 'undefined'}</div>
          <div>actividades.length: {actividades.length}</div>
          <div>alertasPorDia.length: {alertasPorDia.length}</div>
          <div>alertasPorTipo.length: {alertasPorTipo.length}</div>
          <div>alertasPorZona.length: {alertasPorZona.length}</div>
          <div>usuariosPorRol.length: {usuariosPorRol.length}</div>
          <div>estadisticas keys: {Object.keys(estadisticas).join(', ') || '(ninguna)'}</div>
          <div>dashboardData keys: {Object.keys(dashboardData).join(', ') || '(ninguna)'}</div>
          <div style={{ marginTop: '0.25rem', color: 'var(--accent-warning)' }}>
            {actividades.length > 0 && alertas.nuevasHoy === 0 ? '⚠️ INCONSISTENCIA: hay actividades pero nuevasHoy=0' : ''}
          </div>
        </div>
      </details>

      {/* Row 1: Stat Cards */}
      <div className="dashboard-stats-row">
        <div className="stat-card stat-card-users">
          <div className="stat-icon">&#x1F465;</div>
          <div className="stat-body">
            <span className="stat-label">Usuarios</span>
            <span className="stat-value">{formatNumber(usuarios.total || 0)}</span>
            <span className="stat-detail">
              <span style={{ color: COLORS.success }}>{formatNumber(usuarios.activos || 0)} activos</span>
              <span className="stat-divider">|</span>
              <span style={{ color: COLORS.warning }}>{formatNumber(usuarios.inactivos || 0)} inactivos</span>
            </span>
          </div>
        </div>
        <div className="stat-card stat-card-alerts">
          <div className="stat-icon">&#x1F514;</div>
          <div className="stat-body">
            <span className="stat-label">Alertas</span>
            <span className="stat-value">{formatNumber(alertas.total || 0)}</span>
            <span className="stat-detail">
              <span style={{ color: COLORS.danger }}>{formatNumber(alertas.activas || 0)} activas</span>
              <span className="stat-divider">|</span>
              <span style={{ color: COLORS.success }}>{formatNumber(alertas.cerradas || 0)} cerradas</span>
              <span className="stat-divider">|</span>
              <span style={{ color: COLORS.info }}>+{formatNumber(alertas.nuevasHoy || 0)} hoy</span>
            </span>
          </div>
        </div>
        <div className="stat-card stat-card-zones">
          <div className="stat-icon">&#x1F30D;</div>
          <div className="stat-body">
            <span className="stat-label">Zonas</span>
            <span className="stat-value">{formatNumber(zonas.total || 0)}</span>
            <span className="stat-detail">
              <span style={{ color: COLORS.success }}>{formatNumber(zonas.activas || 0)} activas</span>
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary metrics */}
      <div className="dashboard-metrics-row">
        <div className="metric-card">
          <span className="metric-label">Tiempo promedio de resolución</span>
          <span className="metric-value">{formatMin(alertas.tiempoResolucionMin)}</span>
          <span className="metric-sub">
            {alertas.tiempoResolucionMin != null
              ? `Basado en ${formatNumber(alertas.cerradas || 0)} alertas cerradas`
              : 'Sin alertas cerradas para calcular'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Alertas nuevas hoy</span>
          <span className="metric-value" style={{ color: COLORS.info }}>+{formatNumber(alertas.nuevasHoy || 0)}</span>
          <span className="metric-sub">Creadas en las últimas 24h</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Alertas resueltas hoy</span>
          <span className="metric-value" style={{ color: COLORS.success }}>+{formatNumber(alertas.resueltasHoy || 0)}</span>
          <span className="metric-sub">Cerradas en las últimas 24h</span>
        </div>
      </div>

      {/* Row 3: Charts grid */}
      <div className="dashboard-charts-grid">
        {/* 1 - BarChart: Alertas por Día */}
        <div className="chart-card">
          <h3>Alertas por Día</h3>
          {!tieneAlertas ? (
            <EmptyChart msg="No hay alertas registradas" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Alertas" radius={[4, 4, 0, 0]}>
                  {alertasPorDia.map((_, i) => (
                    <Cell key={i} fill={COLORS.primary} fillOpacity={0.5 + (alertasPorDia[i]?.count / maxAlertaCount) * 0.5} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 2 - PieChart: Alertas por Tipo */}
        <div className="chart-card">
          <h3>Alertas por Tipo</h3>
          {alertasPorTipo.length === 0 ? (
            <EmptyChart msg="No hay tipos de alerta registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={alertasPorTipo} dataKey="cantidad" nameKey="tipo" cx="50%" cy="50%" outerRadius={90} label={({ tipo, cantidad }) => `${tipo}: ${cantidad}`}>
                  {alertasPorTipo.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 3 - HorizontalBar: Usuarios por Rol */}
        <div className="chart-card">
          <h3>Usuarios por Rol</h3>
          {usuariosPorRol.length === 0 ? (
            <EmptyChart msg="No hay usuarios registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usuariosPorRol} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <YAxis dataKey="rol" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="cantidad" name="Usuarios" radius={[0, 4, 4, 0]}>
                  {usuariosPorRol.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.primary : i === 1 ? COLORS.purple : COLORS.teal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 4 - Donut: Alertas por Estado */}
        <div className="chart-card">
          <h3>Alertas por Estado</h3>
          {!tieneAlertas ? (
            <EmptyChart msg="No hay alertas registradas" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={alertasPorEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {alertasPorEstado.map((_, i) => (
                    <Cell key={i} fill={[COLORS.danger, COLORS.warning, COLORS.success][i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 5 - LineChart: Tendencia Acumulada */}
        <div className="chart-card">
          <h3>Tendencia Acumulada</h3>
          {tendenciaAcumulada.length === 0 ? (
            <EmptyChart msg="No hay datos semanales" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tendenciaAcumulada}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" name="Total acumulado" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 6 - HorizontalBar: Alertas por Zona */}
        <div className="chart-card">
          <h3>Alertas por Zona</h3>
          {alertasPorZona.length === 0 ? (
            <EmptyChart msg="No hay alertas asociadas a zonas" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertasPorZona} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <YAxis dataKey="zona" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" width={110} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="cantidad" name="Alertas" radius={[0, 4, 4, 0]}>
                  {alertasPorZona.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.danger : i <= 2 ? COLORS.warning : COLORS.info} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 7 - Donut: Estado de Usuarios */}
        <div className="chart-card">
          <h3>Estado de Usuarios</h3>
          {!tieneUsuarios ? (
            <EmptyChart msg="No hay usuarios registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={usuariosEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4}>
                  {usuariosEstado.map((_, i) => (
                    <Cell key={i} fill={[COLORS.success, COLORS.warning][i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 8 - HorizontalBar: Resumen del Día */}
        <div className="chart-card">
          <h3>Resumen del Día</h3>
          {(alertas.nuevasHoy || 0) === 0 && (alertas.resueltasHoy || 0) === 0 ? (
            <EmptyChart msg="Sin actividad en el día de hoy" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Nuevas Hoy', value: alertas.nuevasHoy || 0 },
                { name: 'Resueltas Hoy', value: alertas.resueltasHoy || 0 },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Cantidad" radius={[0, 4, 4, 0]}>
                  <Cell fill={COLORS.info} />
                  <Cell fill={COLORS.success} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 9 - BarChart: Comparativa Activas vs Cerradas */}
        <div className="chart-card">
          <h3>Activas vs Cerradas</h3>
          {!tieneAlertas ? (
            <EmptyChart msg="No hay alertas registradas" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Activas', value: alertas.activas || 0 },
                { name: 'Cerradas', value: alertas.cerradas || 0 },
                { name: 'Asignadas', value: alertas.asignadas || 0 },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Alertas" radius={[0, 4, 4, 0]}>
                  <Cell fill={COLORS.danger} />
                  <Cell fill={COLORS.success} />
                  <Cell fill={COLORS.warning} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 10 - Activity Timeline */}
        <div className="chart-card chart-card-activity">
          <h3>Actividad Reciente</h3>
          <div className="activity-timeline">
            {actividades.length === 0 ? (
              <p className="no-activity">Sin actividad reciente</p>
            ) : (
              actividades.map((act, i) => (
                <div key={act.id} className="timeline-item">
                  <div className={`timeline-dot ${i === 0 ? 'dot-new' : ''}`} />
                  {i < actividades.length - 1 && <div className="timeline-line" />}
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-desc">{act.descripcion}</span>
                      <span className="timeline-time">{formatTime(act.timestamp)}</span>
                    </div>
                    <div className="timeline-meta">
                      <span className="timeline-user">por {act.usuario}</span>
                      <span className="timeline-detail">{act.detalles}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
