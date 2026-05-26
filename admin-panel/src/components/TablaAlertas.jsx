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
    const iconos = { 'Seguridad': '🛡️', 'Médica': '🚑', 'Mantenimiento': '🔧', 'Incendio': '🔥', 'Otro': '⚠️' };
    return iconos[tipo] || '📢';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Extrae los IDs de guardiasInvolucrados sin importar el formato
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

  return (
    <div className="tabla-container">
      <div className="tabla-header">
        <h3>Alertas Recientes</h3>
        <div className="tabla-info">
          <span className="total-alertas">{alertas.length}</span>
          <span>alertas registradas</span>
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="alertas-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Ubicación</th>
              <th>Asignado a</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map(alerta => {
              const titulo    = alerta.motivo     || alerta.Motivo    || 'Sin título';
              const motivoTipo = alerta.motivo || alerta.Motivo || '';
              const tipoMap = {
                  'Robo':        'Seguridad',
                  'Arma blanca': 'Seguridad',
                  'Acoso':       'Seguridad',
                  'Accidente':   'Médica',
                  'Otro':        'Otro',
              };
              const prioridadMap = {
                  'Robo':        'Alta',
                  'Arma blanca': 'Crítica',
                  'Acoso':       'Alta',
                  'Accidente':   'Alta',
                  'Otro':        'Media',
              };
              
              const estado    = alerta.estado     || alerta.Estado    || 'Desconocido';
              const zona      = alerta.zona       || alerta.Zona      || 'Sin zona';
              const fecha     = alerta.creadaEn   || alerta.CreadaEn;
              const fechaCierre = alerta.cerradaEn || alerta.CerradaEn;
              const tipo      = alerta.tipo      || tipoMap[motivoTipo]      || 'General';
              const prioridad = alerta.prioridad || prioridadMap[motivoTipo] || 'Media';

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
                  <td><span className="tipo-badge">{tipo}</span></td>
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
                     {estado === 'Asumida' && (  // ← antes decía 'Asignada'
  <button className="btn-accion btn-cerrar" onClick={() => handleCerrar(alerta)}>
    ✅ Cerrar
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

      {/* Modal Asignar */}
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