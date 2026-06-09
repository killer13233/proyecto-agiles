import { useState, useEffect } from 'react';
import './TablaAlertas.css';
import { getGuardias } from '../services/usuariosService';

const TablaAlertas = ({ 
  alertas = [], 
  loading = false, 
  onAsignar = null, 
  onCerrar = null 
}) => {
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [guardiaSeleccionado, setGuardiaSeleccionado] = useState('');
  const [guardiasDisponibles, setGuardiasDisponibles] = useState([]);
  const [disponibilidadGuardias, setDisponibilidadGuardias] = useState({});

  // ── Filtros ──
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todos');
  const [filtroGuardia, setFiltroGuardia] = useState('Todos');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  
  // ── Sorter y Paginación ──
  const [ordenColumna, setOrdenColumna] = useState('fecha');
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const ELEMENTOS_POR_PAGINA = 15;

  useEffect(() => {
    const fetchGuardias = async () => {
      const result = await getGuardias();
      if (result.success) {
        setGuardiasDisponibles(Array.isArray(result.data) ? result.data : []);
      } else {
        setGuardiasDisponibles([]);
      }
    };
    fetchGuardias();
  }, []);

  useEffect(() => {
  const handler = (e) => {
    const { guardiaId, disponible } = e.detail;
    setDisponibilidadGuardias(prev => ({
      ...prev,
      [String(guardiaId)]: disponible
    }));
  };
  window.addEventListener('guardia-disponibilidad', handler);
  return () => window.removeEventListener('guardia-disponibilidad', handler);
}, []);

  // ── Helpers ──────────────────────────────────────────────────
const getEstadoBadgeClass = (estado) => {
  const clases = {
    'Activa':  'badge-activa',
    'Asumida': 'badge-asignada', // ← Asumida en lugar de Asignada
    'Cerrada': 'badge-cerrada',
  };
  return clases[estado] || 'badge-default';
};

  const getPrioridadBadgeClass = (prioridad) => {
    const clases = { 'Baja': 'badge-baja', 'Media': 'badge-media', 'Alta': 'badge-alta', 'Crítica': 'badge-critica' };
    return clases[prioridad] || 'badge-default';
  };

  const getTipoIcon = (tipo) => {
  const iconos = {
    'Robo': '🚫',
    'Arma blanca': '⚠️',
    'Acoso': '🙍',
    'Accidente': '💥',
    'Emergencia': '🚨',
    'Seguridad': '🛡️',
    'Médica': '🚑',
    'Incendio': '🔥',
    'Otro': '⚠️'
  };
  return iconos[tipo] || '📢';
};
const getTipoBadgeClass = (tipo) => {
  const clases = {
    'Robo':        'tipo-robo',
    'Arma blanca': 'tipo-arma',
    'Acoso':       'tipo-acoso',
    'Accidente':   'tipo-accidente',
    'Emergencia':  'tipo-emergencia',
    'Otro':        'tipo-otro',
  };
  return clases[tipo] || 'tipo-general';
};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Extrae los IDs de guardiasInvolucrados sin importar el formato
  const parseCamarasCercanas = (raw) => {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  const extraerGuardiasIds = (raw) => {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed.filter(id => id && String(id).trim() !== '') : [];
    } catch { return []; }
  };

  // Convierte IDs a nombres usando guardiasDisponibles
  const idsANombres = (ids) => {
    return ids.map(id => {
      const g = guardiasDisponibles.find(gd => String(gd.id) === String(id));
      return g ? g.nombre : `[ID: ${id}]`;
    });
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleAsignar = (alerta) => { setAlertaSeleccionada(alerta); setMostrarModalAsignar(true); };
  const handleCerrar  = (alerta) => { setAlertaSeleccionada(alerta); setMostrarModalCerrar(true); };
  const handleVerDetalles = (alerta) => { setAlertaSeleccionada(alerta); setMostrarModalDetalles(true); };

 const confirmarAsignacion = () => {
  if (!onAsignar || !alertaSeleccionada || !guardiaSeleccionado) {
    alert('Por favor, selecciona un guardia válido');
    return;
  }

  // Verificar que el guardia no esté ocupado
  const estaOcupado = alertas.some(a => {
    if (a.estado === 'Cerrada') return false;
    const ids = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
    return ids.includes(String(guardiaSeleccionado));
  });

  if (estaOcupado) {
    alert('❌ Este guardia ya está atendiendo una alerta activa. Selecciona otro.');
    return;
  }

  const g = guardiasDisponibles.find(gd => String(gd.id) === String(guardiaSeleccionado));
  const finalNombre = g ? g.nombre : 'Guardia Desconocido';
  onAsignar(alertaSeleccionada.id, guardiaSeleccionado, finalNombre);
  setMostrarModalAsignar(false);
  setAlertaSeleccionada(null);
  setGuardiaSeleccionado('');
};

  const confirmarCierre = () => {
    if (onCerrar && alertaSeleccionada) {
      onCerrar(alertaSeleccionada.id, motivoCierre);
      setMostrarModalCerrar(false);
      setAlertaSeleccionada(null);
      setMotivoCierre('');
    }
  };

  if (loading) {
    return (
      <div className="tabla-loading">
        <div className="spinner"></div>
        <p>Cargando alertas...</p>
      </div>
    );
  }

  // ── Filtrado Local ──
  const alertasFiltradasLocales = alertas.filter(a => {
    const titulo = (a.motivo || a.Motivo || '').toLowerCase();
    const zona = (a.zona || a.Zona || '').toLowerCase();
    const usuario = (a.nombreUsuario || '').toLowerCase();
    const tipo = a.motivo || a.Motivo || a.tipo || 'General';
    const estado = a.estado || a.Estado || 'Desconocido';
    const prioridad = a.prioridad || 'Media';
    
    if (filtroEstado !== 'Todos' && estado !== filtroEstado) return false;
    if (filtroTipo !== 'Todos' && tipo !== filtroTipo) return false;
    if (filtroPrioridad !== 'Todos' && prioridad !== filtroPrioridad) return false;
    if (filtroGuardia !== 'Todos') {
      const gIds = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
      const gNombres = idsANombres(gIds);
      if (!gNombres.includes(filtroGuardia)) return false;
    }
    
    const fecha = new Date(a.creadaEn || a.CreadaEn);
    if (filtroFechaInicio && fecha < new Date(filtroFechaInicio)) return false;
    if (filtroFechaFin) {
      const fin = new Date(filtroFechaFin);
      fin.setHours(23, 59, 59, 999);
      if (fecha > fin) return false;
    }

    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      if (!titulo.includes(q) && !zona.includes(q) && !usuario.includes(q)) return false;
    }
    return true;
  });

  const tiposUnicos = ['Todos', ...new Set(alertas.map(a => a.motivo || a.Motivo || a.tipo || 'General'))];
  const prioridadesUnicas = ['Todos', ...new Set(alertas.map(a => a.prioridad || a.Prioridad || 'Media'))];

  const guardiasIdsTotales = new Set();
  alertas.forEach(a => {
    const ids = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
    ids.forEach(id => guardiasIdsTotales.add(String(id)));
  });
  const guardiasUnicosNombres = ['Todos', ...Array.from(guardiasIdsTotales).map(id => {
    const g = guardiasDisponibles.find(gd => String(gd.id) === id);
    return g ? g.nombre : `[ID: ${id}]`;
  })];

  // ── Ordenamiento ──
  const alertasOrdenadas = [...alertasFiltradasLocales].sort((a, b) => {
    let valorA, valorB;
    switch (ordenColumna) {
      case 'fecha':
        valorA = new Date(a.creadaEn || a.CreadaEn).getTime() || 0;
        valorB = new Date(b.creadaEn || b.CreadaEn).getTime() || 0;
        break;
      case 'prioridad':
        const ordenPri = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };
        valorA = ordenPri[a.prioridad || a.Prioridad || 'Media'] || 0;
        valorB = ordenPri[b.prioridad || b.Prioridad || 'Media'] || 0;
        break;
      case 'estado':
        valorA = (a.estado || a.Estado || '').toLowerCase();
        valorB = (b.estado || b.Estado || '').toLowerCase();
        break;
      case 'tipo':
        valorA = (a.motivo || a.Motivo || a.tipo || '').toLowerCase();
        valorB = (b.motivo || b.Motivo || b.tipo || '').toLowerCase();
        break;
      case 'titulo':
        valorA = (a.motivo || a.Motivo || '').toLowerCase();
        valorB = (b.motivo || b.Motivo || '').toLowerCase();
        break;
      default:
        valorA = 0;
        valorB = 0;
    }
    if (valorA < valorB) return ordenDescendente ? 1 : -1;
    if (valorA > valorB) return ordenDescendente ? -1 : 1;
    return 0;
  });

  // ── Paginación ──
  const totalPaginas = Math.ceil(alertasOrdenadas.length / ELEMENTOS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
  const alertasPaginadas = alertasOrdenadas.slice(indiceInicio, indiceInicio + ELEMENTOS_POR_PAGINA);

  // Reset page when filters change
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroBusqueda, filtroEstado, filtroTipo, filtroPrioridad, filtroGuardia, filtroFechaInicio, filtroFechaFin]);

  const handleOrdenar = (columna) => {
    if (ordenColumna === columna) {
      setOrdenDescendente(!ordenDescendente);
    } else {
      setOrdenColumna(columna);
      setOrdenDescendente(columna === 'fecha' || columna === 'prioridad');
    }
  };

  const renderSortIcon = (col) => {
    if (ordenColumna !== col) return <span className="sort-icon">⇅</span>;
    return ordenDescendente ? <span className="sort-icon active">↓</span> : <span className="sort-icon active">↑</span>;
  };

  return (
    <div className="tabla-container">
      <div className="tabla-header">
        <div className="tabla-header-title">
          <h3>Alertas Recientes</h3>
          <div className="tabla-info">
            <span className="total-alertas">{alertasFiltradasLocales.length}</span>
            <span>de {alertas.length} alertas</span>
          </div>
        </div>
        
        <div className="tabla-filtros">
          <div className="filtro-grupo filtro-busqueda">
            <span className="filtro-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar título, zona o usuario..." 
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>
          <div className="filtro-grupo">
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="Todos">Estado: Todos</option>
              <option value="Activa">Activa</option>
              <option value="Asumida">Asignada</option>
              <option value="Cerrada">Cerrada</option>
            </select>
          </div>
          <div className="filtro-grupo">
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              {tiposUnicos.map(t => (
                <option key={t} value={t}>{t === 'Todos' ? 'Tipo: Todos' : t}</option>
              ))}
            </select>
          </div>
          <div className="filtro-grupo">
            <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}>
              {prioridadesUnicas.map(p => (
                <option key={p} value={p}>{p === 'Todos' ? 'Prioridad: Todas' : p}</option>
              ))}
            </select>
          </div>
          <div className="filtro-grupo">
            <select value={filtroGuardia} onChange={(e) => setFiltroGuardia(e.target.value)}>
              {guardiasUnicosNombres.map(g => (
                <option key={g} value={g}>{g === 'Todos' ? 'Guardia: Todos' : g}</option>
              ))}
            </select>
          </div>
          <div className="filtro-grupo">
            <input 
              type="date" 
              title="Fecha Inicio"
              value={filtroFechaInicio} 
              onChange={(e) => setFiltroFechaInicio(e.target.value)} 
            />
          </div>
          <div className="filtro-grupo">
            <input 
              type="date" 
              title="Fecha Fin"
              value={filtroFechaFin} 
              onChange={(e) => setFiltroFechaFin(e.target.value)} 
            />
          </div>
          {(filtroBusqueda || filtroEstado !== 'Todos' || filtroTipo !== 'Todos' || filtroPrioridad !== 'Todos' || filtroGuardia !== 'Todos' || filtroFechaInicio || filtroFechaFin) && (
            <button className="btn-limpiar-filtros" onClick={() => {
              setFiltroBusqueda('');
              setFiltroEstado('Todos');
              setFiltroTipo('Todos');
              setFiltroPrioridad('Todos');
              setFiltroGuardia('Todos');
              setFiltroFechaInicio('');
              setFiltroFechaFin('');
            }} title="Limpiar Filtros">✖</button>
          )}
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="alertas-table">
          <thead>
            <tr>
              <th onClick={() => handleOrdenar('titulo')} className="sortable">Título {renderSortIcon('titulo')}</th>
              <th onClick={() => handleOrdenar('tipo')} className="sortable">Tipo {renderSortIcon('tipo')}</th>
              <th onClick={() => handleOrdenar('prioridad')} className="sortable">Prioridad {renderSortIcon('prioridad')}</th>
              <th onClick={() => handleOrdenar('estado')} className="sortable">Estado {renderSortIcon('estado')}</th>
              <th>Ubicación</th>
              <th>Asignado a</th>
              <th onClick={() => handleOrdenar('fecha')} className="sortable">Fecha {renderSortIcon('fecha')}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alertasPaginadas.length === 0 ? (
              <tr>
                <td colSpan="8" className="tabla-empty">No se encontraron alertas que coincidan con los filtros.</td>
              </tr>
            ) : alertasPaginadas.map(alerta => {
              const titulo    = alerta.motivo     || alerta.Motivo    || 'Sin título';
              const estado    = alerta.estado     || alerta.Estado    || 'Desconocido';
              const zona      = alerta.zona       || alerta.Zona      || 'Sin zona';
              const fecha     = alerta.creadaEn   || alerta.CreadaEn;
              const fechaCierre = alerta.cerradaEn || alerta.CerradaEn;
              const tipo = alerta.motivo || alerta.Motivo || alerta.tipo || 'General';
              const prioridad = alerta.prioridad  || 'Media';

              const guardiasIds    = extraerGuardiasIds(alerta.guardiasInvolucrados || alerta.GuardiasInvolucrados);
              const guardiasNombres = idsANombres(guardiasIds);

              return (
                <tr key={alerta.id}>
                  <td className="titulo-cell">
                    <div className="alerta-titulo">
                      <span className="tipo-icon">{getTipoIcon(tipo)}</span>
                      {titulo}
                    </div>
                  </td>
                  <td><span className={`tipo-badge ${getTipoBadgeClass(tipo)}`}>{tipo}</span></td>
                  <td><span className={`badge ${getPrioridadBadgeClass(prioridad)}`}>{prioridad}</span></td>
                  <td><span className={`badge ${getEstadoBadgeClass(estado)}`}>{estado}</span></td>
                  <td className="ubicacion-cell">
                    <div className="ubicacion-info">
                      <span className="ubicacion-icon">📍</span>
                      <span>{zona}</span>
                    </div>
                  </td>
                  <td>
                    {guardiasNombres.length > 0
                      ? <span className="usuario-asignado">{guardiasNombres.join(', ')}</span>
                      : <span className="sin-asignar">Sin asignar</span>
                    }
                  </td>
                  <td>
                    <div className="fecha-info">
                      <div className="fecha-creacion">{formatDate(fecha)}</div>
                      {fechaCierre && <div className="fecha-cierre">Cerrada: {formatDate(fechaCierre)}</div>}
                    </div>
                  </td>
                  <td>
                    <div className="acciones-cell">
                      <button className="btn-accion btn-detalles" onClick={() => handleVerDetalles(alerta)}>
                        📋 Detalles
                      </button>
                      {estado === 'Activa' && (
                        <button className="btn-accion btn-asignar" onClick={() => handleAsignar(alerta)}>
                          👤 Asignar
                        </button>
                      )}
                     
                      {estado === 'Cerrada' && (
                        <span className="accion-completada">✅ Completada</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="tabla-paginacion">
          <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>
            Anterior
          </button>
          <span>Página {paginaActual} de {totalPaginas}</span>
          <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Asignación */}
      {mostrarModalAsignar && alertaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Asignar Alerta</h3>
              <button className="modal-close" onClick={() => setMostrarModalAsignar(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <h4>{alertaSeleccionada.motivo || alertaSeleccionada.Motivo || 'Sin título'}</h4>
                <p><strong>Zona:</strong> {alertaSeleccionada.zona || alertaSeleccionada.Zona || 'Sin zona'}</p>
                <p><strong>Reportado por:</strong> {alertaSeleccionada.nombreUsuario || 'Desconocido'}</p>
              </div>
              <div className="guardia-selection">
                <label htmlFor="guardia">Seleccionar guardia:</label>
                <select
                  id="guardia"
                  value={guardiaSeleccionado}
                  onChange={(e) => setGuardiaSeleccionado(e.target.value)}
                  className="guardia-select"
                >
                  <option value="">-- Seleccionar guardia --</option>
                 {guardiasDisponibles.map(guardia => {
  const estaOcupado = alertas.some(a => {
    if (a.estado === 'Cerrada') return false;
    const ids = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
    return ids.includes(String(guardia.id));
  });

  const estaNoDisponible = disponibilidadGuardias[String(guardia.id)] === false;

  return (
    <option 
      key={guardia.id} 
      value={guardia.id}
      disabled={estaOcupado || estaNoDisponible}
    >
      {guardia.nombre} {estaNoDisponible ? '⛔ No disponible' : estaOcupado ? '🔴 Ocupado' : '🟢 Disponible'}
    </option>
  );
})}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => setMostrarModalAsignar(false)}>Cancelar</button>
              <button className="btn btn-confirmar" onClick={confirmarAsignacion}>Confirmar Asignación</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar */}
      {mostrarModalCerrar && alertaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Cerrar Alerta</h3>
              <button className="modal-close" onClick={() => setMostrarModalCerrar(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <h4>{alertaSeleccionada.motivo || alertaSeleccionada.Motivo || 'Sin título'}</h4>
                <p><strong>Estado actual:</strong>
                  <span className={`badge ${getEstadoBadgeClass(alertaSeleccionada.estado)}`}>
                    {alertaSeleccionada.estado}
                  </span>
                </p>
              </div>
              <div className="cierre-form">
                <label htmlFor="motivo">Motivo del cierre:</label>
                <textarea
                  id="motivo"
                  value={motivoCierre}
                  onChange={(e) => setMotivoCierre(e.target.value)}
                  placeholder="Describe por qué se cierra esta alerta..."
                  className="motivo-textarea"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => setMostrarModalCerrar(false)}>Cancelar</button>
              <button className="btn btn-cerrar" onClick={confirmarCierre}>Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {mostrarModalDetalles && alertaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Detalles de Alerta</h3>
              <button className="modal-close" onClick={() => setMostrarModalDetalles(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <p><strong>Motivo:</strong> {alertaSeleccionada.motivo || alertaSeleccionada.Motivo}</p>
                <p><strong>Estado:</strong>
                  <span className={`badge ${getEstadoBadgeClass(alertaSeleccionada.estado)}`}>
                    {alertaSeleccionada.estado}
                  </span>
                </p>
                <p><strong>Zona:</strong> {alertaSeleccionada.zona || alertaSeleccionada.Zona}</p>
                <p><strong>Coordenadas:</strong> {alertaSeleccionada.latitud?.toFixed(6)}, {alertaSeleccionada.longitud?.toFixed(6)}</p>
                <p><strong>Reportado por:</strong> {alertaSeleccionada.nombreUsuario}</p>
                <p><strong>Rol:</strong> {alertaSeleccionada.rolUsuario}</p>
                {(() => {
                  const ids = extraerGuardiasIds(alertaSeleccionada.guardiasInvolucrados);
                  const nombres = idsANombres(ids);
                  return nombres.length > 0
                    ? <p><strong>Guardia(s) involucrado(s):</strong> {nombres.join(', ')}</p>
                    : null;
                })()}
                <p><strong>Fecha creación:</strong> {formatDate(alertaSeleccionada.creadaEn)}</p>
                {alertaSeleccionada.cerradaEn && (
                  <p><strong>Fecha cierre:</strong> {formatDate(alertaSeleccionada.cerradaEn)}</p>
                )}
                {alertaSeleccionada.motivoResolucion && (
                  <p><strong>Motivo resolución:</strong> {alertaSeleccionada.motivoResolucion}</p>
                )}
                {alertaSeleccionada.resolucionDescripcion && (
                  <p><strong>Resolución:</strong> {alertaSeleccionada.resolucionDescripcion}</p>
                )}
                {alertaSeleccionada.cerradaPor && (
                  <p><strong>Cerrada por ID:</strong> {alertaSeleccionada.cerradaPor}</p>
                )}
                {(() => {
                  const camaras = parseCamarasCercanas(alertaSeleccionada.camarasCercanas);
                  return camaras.length > 0 ? (
                    <div className="camaras-cercanas" style={{ marginTop: '0.5rem' }}>
                      <strong>Cámaras cercanas:</strong>
                      <ol style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
                        {camaras.map((c, i) => (
                          <li key={i}>{c.nombre} — <em>{c.distanciaMetros.toFixed(1)}m</em></li>
                        ))}
                      </ol>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => setMostrarModalDetalles(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaAlertas;