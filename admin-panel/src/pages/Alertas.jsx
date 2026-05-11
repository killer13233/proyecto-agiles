import { useState, useEffect } from 'react';
import { getAlertas, asignarAlerta, cerrarAlerta, getTiposAlerta, getPrioridadesAlerta, getEstadosAlerta } from '../services/alertasService';
import TablaAlertas from '../components/TablaAlertas';
import './Alertas.css';

const Alertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    prioridad: '',
    usuario: '',
    fechaDesde: ''
  });
  const [debouncedFiltros, setDebouncedFiltros] = useState(filtros);

  const tiposAlerta = getTiposAlerta();
  const prioridadesAlerta = getPrioridadesAlerta();
  const estadosAlerta = getEstadosAlerta();

  // Efecto para el debounce de los filtros
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFiltros(filtros);
    }, 300);

    return () => clearTimeout(handler);
  }, [filtros]);

  useEffect(() => {
    cargarAlertas(true);

    // Actualización automática cada 10 segundos
    const interval = setInterval(() => {
      cargarAlertas(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [debouncedFiltros]);

  const cargarAlertas = async (isFilterUpdate = false) => {
    if (!isFilterUpdate) setLoading(true);
    setError('');
    
    try {
      const resultado = await getAlertas(debouncedFiltros);
      
      if (resultado.success) {
        setAlertas(Array.isArray(resultado.data) ? resultado.data : (resultado.data.alertas || []));
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cargar las alertas');
    } finally {
      setLoading(false);
    }
  };


  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      tipo: '',
      prioridad: '',
      usuario: '',
      fechaDesde: ''
    });
  };

  const handleAsignar = async (idAlerta, guardiaId, nombreGuardia) => {
    try {
      const resultado = await asignarAlerta(idAlerta, guardiaId, nombreGuardia);
      
      if (resultado.success) {
        alert('✅ Alerta asignada correctamente a ' + nombreGuardia);
        await cargarAlertas();
      } else {
        alert('❌ Error al asignar: ' + resultado.error);
        setError(resultado.error);
      }
    } catch (err) {
      alert('❌ Error crítico al asignar la alerta');
      setError('Error al asignar la alerta');
    }
  };

  const handleCerrar = async (idAlerta, motivo) => {
    try {
      const resultado = await cerrarAlerta(idAlerta, motivo);
      
      if (resultado.success) {
        // Recargar alertas para mostrar el cambio
        await cargarAlertas();
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cerrar la alerta');
    }
  };

  const getAlertasActivas = () => {
    return alertas.filter(a => a.estado === 'Activa').length;
  };

  const getAlertasAsignadas = () => {
    return alertas.filter(a => a.estado === 'Asignada').length;
  };

  const getAlertasCerradas = () => {
    return alertas.filter(a => a.estado === 'Cerrada').length;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando alertas...</p>
      </div>
    );
  }

  return (
    <div className="alertas-container">
      <div className="alertas-header">
        <h1>Gestión de Alertas</h1>
        <div className="estadisticas">
          <div className="stat-card">
            <span className="stat-number">{getAlertasActivas()}</span>
            <span className="stat-label">Activas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getAlertasAsignadas()}</span>
            <span className="stat-label">Asignadas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getAlertasCerradas()}</span>
            <span className="stat-label">Cerradas</span>
          </div>
        </div>
      </div>

      <div className="filtros-section">
        <h3>Filtros</h3>
        <div className="filtros-grid">
          <div className="filtro-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los estados</option>
              {estadosAlerta.map(estado => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los tipos</option>
              {tiposAlerta.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label htmlFor="prioridad">Prioridad</label>
            <select
              id="prioridad"
              value={filtros.prioridad}
              onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas las prioridades</option>
              {prioridadesAlerta.map(prioridad => (
                <option key={prioridad} value={prioridad}>
                  {prioridad}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              value={filtros.usuario}
              onChange={(e) => handleFiltroChange('usuario', e.target.value)}
              placeholder="Buscar por usuario..."
              className="filtro-input"
            />
          </div>

          <div className="filtro-group">
            <label htmlFor="fechaDesde">Desde</label>
            <input
              type="date"
              id="fechaDesde"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="filtro-input"
            />
          </div>

          <button
            className="btn btn-limpiar"
            onClick={limpiarFiltros}
          >
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="tabla-section">
        <TablaAlertas
          alertas={alertas}
          loading={loading}
          onAsignar={handleAsignar}
          onCerrar={handleCerrar}
        />
      </div>
    </div>
  );
};

export default Alertas;
