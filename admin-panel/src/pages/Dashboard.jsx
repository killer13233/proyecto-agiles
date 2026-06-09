import { useState, useEffect, useRef, useCallback } from 'react';
import { getDashboardData } from '../services/dashboardService';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { asignarAlerta, cerrarAlerta } from '../services/alertasService';
import TablaAlertas from '../components/TablaAlertas';
import './Dashboard.css';

const COLORS = {
  primary: '#4f8cff', success: '#2ed573', warning: '#ffa502',
  danger: '#ff4757', info: '#17a2b8', purple: '#a855f7', teal: '#14b8a6',
  pink: '#ec4899', indigo: '#6366f1', cyan: '#06b6d4',
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

const formatDateForInput = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateLabel = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
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
    <span className="chart-empty-icon">📊</span>
    <p>{msg}</p>
  </div>
);

// ── Date Range Presets ─────────────────────────────────────────────
const PRESETS = [
  { id: 'hoy', label: 'Hoy', icon: '📅' },
  { id: '7d', label: '7 días', icon: '📆' },
  { id: '30d', label: '30 días', icon: '🗓️' },
  { id: '90d', label: '3 meses', icon: '📊' },
  { id: 'custom', label: 'Personalizado', icon: '🎯' },
];

const getPresetDates = (presetId) => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  switch (presetId) {
    case 'hoy':
      return { fechaInicio: today, fechaFin: today };
    case '7d': {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 6);
      return { fechaInicio: start, fechaFin: today };
    }
    case '30d': {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 29);
      return { fechaInicio: start, fechaFin: today };
    }
    case '90d': {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 89);
      return { fechaInicio: start, fechaFin: today };
    }
    default:
      return { fechaInicio: null, fechaFin: null };
  }
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const isMounted = useRef(true);

  // Date filter state
  const [activePreset, setActivePreset] = useState('7d');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isTablaVisible, setIsTablaVisible] = useState(false);

  // Initialize with the 7-day preset
  useEffect(() => {
    const { fechaInicio: fi, fechaFin: ff } = getPresetDates('7d');
    setFechaInicio(fi);
    setFechaFin(ff);
  }, []);

  const cargarDatosDashboard = useCallback(async (esCargaInicial = false, filtro = {}) => {
    if (!isMounted.current) return;
    if (esCargaInicial) setLoading(true);
    else setRefreshing(true);
    try {
      const resultado = await getDashboardData(filtro);
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
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const filtro = { fechaInicio, fechaFin };
    cargarDatosDashboard(true, filtro);
    const interval = setInterval(() => cargarDatosDashboard(false, filtro), 15000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fechaInicio, fechaFin, cargarDatosDashboard]);

  const handlePresetClick = (presetId) => {
    setActivePreset(presetId);
    if (presetId === 'custom') {
      setShowCustomRange(true);
      return;
    }
    setShowCustomRange(false);
    const { fechaInicio: fi, fechaFin: ff } = getPresetDates(presetId);
    setFechaInicio(fi);
    setFechaFin(ff);
  };

  const handleCustomApply = () => {
    if (customStart) {
      const parts = customStart.split('-');
      setFechaInicio(new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2])));
    }
    if (customEnd) {
      const parts = customEnd.split('-');
      setFechaFin(new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2])));
    }
    setShowCustomRange(false);
  };

  const handleAsignarAlertaDashboard = async (idAlerta, guardiaId, nombreGuardia) => {
    const resultado = await asignarAlerta(idAlerta, guardiaId, nombreGuardia);
    if (resultado.success) {
      alert(`✅ Alerta asignada a ${nombreGuardia}`);
      cargarDatosDashboard(false, { fechaInicio, fechaFin });
    } else {
      alert('❌ Error al asignar: ' + resultado.error);
    }
  };

  const handleCerrarAlertaDashboard = async (idAlerta, motivo) => {
    const resultado = await cerrarAlerta(idAlerta, motivo);
    if (resultado.success) {
      alert('✅ Alerta cerrada correctamente');
      cargarDatosDashboard(false, { fechaInicio, fechaFin });
    } else {
      alert('❌ Error al cerrar: ' + resultado.error);
    }
  };

  const { usuarios = {}, alertas = {}, zonas = {}, estadisticas = {}, actividades = [] } = dashboardData;
  const { alertasPorDia = [], alertasPorTipo = [], alertasPorZona = [], usuariosPorRol = [], topUsuarios = [], topGuardias = [], alertasPorHora = [], alertasPorDiaSemana = [], tiempoResolucionGuardias = [] } = estadisticas;

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
    acc.push({ dia: d.dia, total: prev + d.count, diario: d.count });
    return acc;
  }, []);

  const formatUltimaActualizacion = (fecha) => {
    const diffSegundos = Math.floor((new Date() - fecha) / 1000);
    if (diffSegundos < 60) return 'Justo ahora';
    if (diffSegundos < 3600) return `Hace ${Math.floor(diffSegundos / 60)} min`;
    return `Hace ${Math.floor(diffSegundos / 3600)} h`;
  };

  const getFilterLabel = () => {
    if (activePreset !== 'custom' && activePreset !== 'hoy') {
      const preset = PRESETS.find(p => p.id === activePreset);
      return preset ? `Últimos ${preset.label}` : '';
    }
    if (activePreset === 'hoy') return 'Hoy';
    if (fechaInicio && fechaFin) {
      return `${formatDateLabel(fechaInicio)} — ${formatDateLabel(fechaFin)}`;
    }
    return 'Rango personalizado';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-pulse">
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
        </div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const maxAlertaCount = Math.max(...alertasPorDia.map(d => d.count), 1);
  const tieneAlertas = alertas.total > 0;
  const tieneUsuarios = usuarios.total > 0;
  const alertasPorDiaConDatos = alertasPorDia.some(d => d.count > 0);

  // Calculate percentages for donut center labels
  const tasaResolucion = tieneAlertas
    ? Math.round(((alertas.cerradas || 0) / alertas.total) * 100)
    : 0;

  return (
    <div className="dashboard-container">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <span className="header-gradient">Dashboard</span>
          </h1>
          <p className="header-subtitle">Panel de control y analíticas en tiempo real</p>
        </div>
        <div className="header-right">
          <div className={`refresh-badge ${refreshing ? 'refreshing' : ''}`}>
            <span className="refresh-dot"></span>
            <span>{formatUltimaActualizacion(ultimaActualizacion)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* ── Date Filter Bar ────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="filter-bar-inner">
          <div className="filter-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Filtrar por fecha:</span>
          </div>

          <div className="filter-presets">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                className={`filter-preset-btn ${activePreset === preset.id ? 'active' : ''}`}
                onClick={() => handlePresetClick(preset.id)}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {fechaInicio && fechaFin && activePreset !== 'custom' && (
            <div className="filter-range-display">
              <span className="range-badge">
                {getFilterLabel()}
              </span>
            </div>
          )}
        </div>

        {/* Custom date range picker */}
        {showCustomRange && (
          <div className="custom-range-panel">
            <div className="custom-range-fields">
              <div className="date-field">
                <label>Desde</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  max={customEnd || formatDateForInput(new Date())}
                />
              </div>
              <div className="date-separator">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
              <div className="date-field">
                <label>Hasta</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={formatDateForInput(new Date())}
                />
              </div>
              <button
                className="apply-btn"
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="dashboard-kpi-row">
        <div className="kpi-card kpi-users">
          <div className="kpi-glow"></div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Usuarios Totales</span>
            <span className="kpi-value">{formatNumber(usuarios.total || 0)}</span>
            <div className="kpi-detail">
              <span className="kpi-tag kpi-tag-success">{formatNumber(usuarios.activos || 0)} activos</span>
              <span className="kpi-tag kpi-tag-warning">{formatNumber(usuarios.inactivos || 0)} inactivos</span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-alerts">
          <div className="kpi-glow"></div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Alertas {activePreset === 'hoy' ? 'Hoy' : 'en Período'}</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{formatNumber(alertas.total || 0)}</span>
              {alertas.tasaCambio != null && (
                <span className={`kpi-trend ${alertas.tasaCambio >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {alertas.tasaCambio >= 0 ? '↑' : '↓'} {Math.abs(alertas.tasaCambio)}%
                </span>
              )}
            </div>
            <div className="kpi-detail">
              <span className="kpi-tag kpi-tag-danger">{formatNumber(alertas.activas || 0)} activas</span>
              <span className="kpi-tag kpi-tag-success">{formatNumber(alertas.cerradas || 0)} cerradas</span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-zones">
          <div className="kpi-glow"></div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Zonas Activas</span>
            <span className="kpi-value">{formatNumber(zonas.total || 0)}</span>
            <div className="kpi-detail">
              <span className="kpi-tag kpi-tag-info">{formatNumber(zonas.activas || 0)} monitoreadas</span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-resolution">
          <div className="kpi-glow"></div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tiempo Resolución</span>
            <span className="kpi-value">{formatMin(alertas.tiempoResolucionMin)}</span>
            <div className="kpi-detail">
              <span className="kpi-tag kpi-tag-primary">Promedio del período</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ────────────────────────────────────── */}
      <div className="quick-stats-row">
        <div className="quick-stat">
          <div className="quick-stat-icon qs-new">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <div className="quick-stat-body">
            <span className="quick-stat-value">+{formatNumber(alertas.nuevasHoy || 0)}</span>
            <span className="quick-stat-label">Nuevas hoy</span>
          </div>
        </div>
        <div className="quick-stat">
          <div className="quick-stat-icon qs-resolved">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="quick-stat-body">
            <span className="quick-stat-value">+{formatNumber(alertas.resueltasHoy || 0)}</span>
            <span className="quick-stat-label">Resueltas hoy</span>
          </div>
        </div>
        <div className="quick-stat">
          <div className="quick-stat-icon qs-critical">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className="quick-stat-body">
            <span className="quick-stat-value">{formatNumber(alertas.criticas || 0)}</span>
            <span className="quick-stat-label">Críticas</span>
          </div>
        </div>
        <div className="quick-stat">
          <div className="quick-stat-icon qs-rate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="quick-stat-body">
            <span className="quick-stat-value">{tasaResolucion}%</span>
            <span className="quick-stat-label">Tasa resolución</span>
          </div>
        </div>
      </div>

      {/* ── Charts Section ─────────────────────────────────────── */}
      <div className="dashboard-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2>Analíticas Detalladas</h2>
          <span className="section-badge">{getFilterLabel()}</span>
        </div>
        <button className="btn-view-table" onClick={() => setIsTablaVisible(true)}>
          <span className="btn-icon">📋</span> Ver Tabla de Alertas
        </button>
      </div>

      <div className="dashboard-charts-grid">
        {/* 1 - AreaChart: Alertas por Día */}
        <div className="chart-card chart-card-wide">
          <div className="chart-header">
            <h3>Evolución de Alertas</h3>
            <span className="chart-badge">{alertasPorDia.length} períodos</span>
          </div>
          {!alertasPorDiaConDatos ? (
            <EmptyChart msg={tieneAlertas ? 'Sin alertas en el período seleccionado' : 'No hay alertas registradas'} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={alertasPorDia}>
                <defs>
                  <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Alertas" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradientArea)" dot={{ fill: COLORS.primary, r: 3 }} activeDot={{ r: 6, fill: COLORS.primary, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 2 - PieChart: Alertas por Tipo */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Alertas por Tipo</h3>
            <span className="chart-badge">{alertasPorTipo.length} tipos</span>
          </div>
          {alertasPorTipo.length === 0 ? (
            <EmptyChart msg="No hay tipos de alerta registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
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

        {/* 3 - Donut: Alertas por Estado */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Estado de Alertas</h3>
          </div>
          {!tieneAlertas ? (
            <EmptyChart msg="No hay alertas registradas" />
          ) : (
            <div className="donut-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={alertasPorEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} cornerRadius={4}>
                    {alertasPorEstado.map((_, i) => (
                      <Cell key={i} fill={[COLORS.danger, COLORS.warning, COLORS.success][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <span className="donut-center-value">{tasaResolucion}%</span>
                <span className="donut-center-text">Resueltas</span>
              </div>
            </div>
          )}
        </div>

        {/* 4 - LineChart: Tendencia Acumulada */}
        <div className="chart-card chart-card-wide">
          <div className="chart-header">
            <h3>Tendencia Acumulada</h3>
            <span className="chart-badge">Acumulativo</span>
          </div>
          {tendenciaAcumulada.length === 0 ? (
            <EmptyChart msg="No hay datos en el período" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tendenciaAcumulada}>
                <defs>
                  <linearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.purple} />
                    <stop offset="100%" stopColor={COLORS.primary} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" name="Total acumulado" stroke="url(#gradientLine)" strokeWidth={3} dot={{ fill: COLORS.purple, r: 4 }} activeDot={{ r: 7, fill: COLORS.primary, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 5 - HorizontalBar: Alertas por Zona */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Zonas con Más Alertas</h3>
            <span className="chart-badge">Zonas Conflictivas</span>
          </div>
          {alertasPorZona.length === 0 ? (
            <EmptyChart msg="No hay alertas asociadas a zonas" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={alertasPorZona} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <YAxis dataKey="zona" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" width={110} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="cantidad" name="Alertas" radius={[0, 6, 6, 0]}>
                  {alertasPorZona.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.danger : i <= 2 ? COLORS.warning : COLORS.info} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 6 - HorizontalBar: Usuarios por Rol */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Usuarios por Rol</h3>
          </div>
          {usuariosPorRol.length === 0 ? (
            <EmptyChart msg="No hay usuarios registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={usuariosPorRol} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <YAxis dataKey="rol" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="cantidad" name="Usuarios" radius={[0, 6, 6, 0]}>
                  {usuariosPorRol.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.primary : i === 1 ? COLORS.purple : COLORS.teal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 7 - Donut: Estado de Usuarios */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Estado de Usuarios</h3>
          </div>
          {!tieneUsuarios ? (
            <EmptyChart msg="No hay usuarios registrados" />
          ) : (
            <div className="donut-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={usuariosEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} cornerRadius={4}>
                    {usuariosEstado.map((_, i) => (
                      <Cell key={i} fill={[COLORS.success, COLORS.warning][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <span className="donut-center-value">{tieneUsuarios ? Math.round(((usuarios.activos || 0) / usuarios.total) * 100) : 0}%</span>
                <span className="donut-center-text">Activos</span>
              </div>
            </div>
          )}
        </div>

        {/* 8 - Comparativa: Resumen del Día */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Resumen del Día</h3>
            <span className="chart-badge">Hoy</span>
          </div>
          {(alertas.nuevasHoy || 0) === 0 && (alertas.resueltasHoy || 0) === 0 ? (
            <EmptyChart msg="Sin actividad en el día de hoy" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: 'Nuevas', value: alertas.nuevasHoy || 0 },
                { name: 'Resueltas', value: alertas.resueltasHoy || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Alertas" radius={[6, 6, 0, 0]}>
                  <Cell fill={COLORS.info} />
                  <Cell fill={COLORS.success} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 9 - Top Usuarios (Alertas Reportadas) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Usuarios</h3>
            <span className="chart-badge">Más alertas reportadas</span>
          </div>
          {topUsuarios.length === 0 ? (
            <EmptyChart msg="No hay reportes suficientes" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topUsuarios} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                <Bar dataKey="cantidad" name="Alertas" fill={COLORS.pink} radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 10 - Top Guardias (Casos Atendidos) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Guardias</h3>
            <span className="chart-badge">Más casos atendidos</span>
          </div>
          {topGuardias.length === 0 ? (
            <EmptyChart msg="No hay asignaciones registradas" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topGuardias} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                <Bar dataKey="cantidad" name="Casos Atendidos" fill={COLORS.cyan} radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 11 - Mapa de Calor (Barras): Alertas por Hora */}
        <div className="chart-card chart-card-wide">
          <div className="chart-header">
            <h3>Horas Pico de Emergencias</h3>
            <span className="chart-badge">Alertas por Hora</span>
          </div>
          {alertasPorHora.length === 0 ? (
            <EmptyChart msg="No hay datos de hora registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={alertasPorHora}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hora" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Alertas" radius={[4, 4, 0, 0]}>
                  {alertasPorHora.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > Math.max(...alertasPorHora.map(h => h.count)) * 0.8 ? COLORS.danger : entry.count > Math.max(...alertasPorHora.map(h => h.count)) * 0.5 ? COLORS.warning : COLORS.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 12 - RadarChart: Alertas por Día de la Semana */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Días más Peligrosos</h3>
            <span className="chart-badge">Alertas por Día</span>
          </div>
          {alertasPorDiaSemana.length === 0 ? (
            <EmptyChart msg="No hay datos de días registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={alertasPorDiaSemana}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dia" tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                <Radar name="Alertas" dataKey="count" stroke={COLORS.indigo} fill={COLORS.indigo} fillOpacity={0.6} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 13 - HorizontalBar: Tiempo Promedio de Resolución por Guardia */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Eficiencia de Guardias</h3>
            <span className="chart-badge">T. Promedio Resol. (min)</span>
          </div>
          {tiempoResolucionGuardias.length === 0 ? (
            <EmptyChart msg="No hay tiempos de resolución" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tiempoResolucionGuardias} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" />
                <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} formatter={(val) => `${val} min`} />
                <Bar dataKey="tiempoPromedio" name="Minutos" fill={COLORS.teal} radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 14 - Activity Timeline */}
        <div className="chart-card chart-card-wide">
          <div className="chart-header">
            <h3>Actividad Reciente</h3>
            <span className="chart-badge">{actividades.length} eventos</span>
          </div>
          <div className="activity-timeline">
            {actividades.length === 0 ? (
              <p className="no-activity">Sin actividad reciente en el período</p>
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

      {/* ── Modal Tabla de Alertas ───────────────────────────── */}
      {isTablaVisible && (
        <div className="dashboard-modal-overlay" onClick={() => setIsTablaVisible(false)}>
          <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="dashboard-modal-close" onClick={() => setIsTablaVisible(false)}>×</button>
            <div className="dashboard-modal-body">
              <TablaAlertas 
                alertas={dashboardData.todasLasAlertas || []} 
                loading={loading} 
                onAsignar={handleAsignarAlertaDashboard} 
                onCerrar={handleCerrarAlertaDashboard} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
