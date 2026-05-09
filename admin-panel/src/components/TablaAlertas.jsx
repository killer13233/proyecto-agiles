import { useState } from 'react';
import './TablaAlertas.css';

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

  // Lista de guardias disponibles (mock)
  const guardiasDisponibles = [
    { id: 1, nombre: 'Juan Paredes' },
    { id: 2, nombre: 'Martin Palacios' },
    { id: 3, nombre: 'Sheyla Pacha' },
    { id: 4, nombre: 'Abel Chiriboga' },
    { id: 5, nombre: 'Carlos Mendoza' },
    { id: 6, nombre: 'Maria Rodriguez' }
  ];

  const handleAsignar = (alerta) => {
    setAlertaSeleccionada(alerta);
    setMostrarModalAsignar(true);
  };

  const handleCerrar = (alerta) => {
    setAlertaSeleccionada(alerta);
    setMostrarModalCerrar(true);
  };

  const handleVerDetalles = (alerta) => {
    setAlertaSeleccionada(alerta);
    setMostrarModalDetalles(true);
  };

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      'Activa': 'badge-activa',
      'Asignada': 'badge-asignada',
      'Cerrada': 'badge-cerrada',
      'Cancelada': 'badge-cancelada'
    };
    return clases[estado] || 'badge-default';
  };

  const getPrioridadBadgeClass = (prioridad) => {
    const clases = {
      'Baja': 'badge-baja',
      'Media': 'badge-media',
      'Alta': 'badge-alta',
      'Crítica': 'badge-critica'
    };
    return clases[prioridad] || 'badge-default';
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      'Seguridad': '🛡️',
      'Médica': '🚑',
      'Mantenimiento': '🔧',
      'Incendio': '🔥',
      'Otro': '⚠️'
    };
    return iconos[tipo] || '📢';
  };

  const confirmarAsignacion = () => {
    if (onAsignar && alertaSeleccionada && guardiaSeleccionado) {
      onAsignar(alertaSeleccionada.id, guardiaSeleccionado);
      setMostrarModalAsignar(false);
      setAlertaSeleccionada(null);
      setGuardiaSeleccionado('');
    }
  };

  const confirmarCierre = () => {
    if (onCerrar && alertaSeleccionada) {
      onCerrar(alertaSeleccionada.id, motivoCierre);
      setMostrarModalCerrar(false);
      setAlertaSeleccionada(null);
      setMotivoCierre('');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            {alertas.map(alerta => (
              <tr key={alerta.id}>
                <td className="titulo-cell">
                  <div className="alerta-titulo">
                    <span className="tipo-icon">{getTipoIcon(alerta.tipo)}</span>
                    {alerta.titulo}
                  </div>
                </td>
                <td>
                  <span className="tipo-badge">{alerta.tipo}</span>
                </td>
                <td>
                  <span className={`badge ${getPrioridadBadgeClass(alerta.prioridad)}`}>
                    {alerta.prioridad}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getEstadoBadgeClass(alerta.estado)}`}>
                    {alerta.estado}
                  </span>
                </td>
                <td className="ubicacion-cell">
                  <div className="ubicacion-info">
                    <span className="ubicacion-icon">📍</span>
                    <span>{alerta.ubicacion}</span>
                  </div>
                </td>
                <td>
                  {alerta.usuarioAsignado ? (
                    <span className="usuario-asignado">{alerta.usuarioAsignado}</span>
                  ) : (
                    <span className="sin-asignar">Sin asignar</span>
                  )}
                </td>
                <td>
                  <div className="fecha-info">
                    <div className="fecha-creacion">
                      {formatDate(alerta.fechaCreacion)}
                    </div>
                    {alerta.fechaAsignacion && (
                      <div className="fecha-asignacion">
                        Asignada: {formatDate(alerta.fechaAsignacion)}
                      </div>
                    )}
                    {alerta.fechaCierre && (
                      <div className="fecha-cierre">
                        Cerrada: {formatDate(alerta.fechaCierre)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="acciones-cell">
                    <button
                      className="btn-accion btn-detalles"
                      onClick={() => handleVerDetalles(alerta)}
                    >
                      📋 Detalles
                    </button>
                    {alerta.estado === 'Activa' && (
                      <button
                        className="btn-accion btn-asignar"
                        onClick={() => handleAsignar(alerta)}
                      >
                        👤 Asignar
                      </button>
                    )}
                    {alerta.estado === 'Asignada' && (
                      <button
                        className="btn-accion btn-cerrar"
                        onClick={() => handleCerrar(alerta)}
                      >
                        ✅ Cerrar
                      </button>
                    )}
                    {alerta.estado === 'Cerrada' && (
                      <span className="accion-completada">✅ Completada</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Asignar Alerta */}
      {mostrarModalAsignar && alertaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Asignar Alerta</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalAsignar(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <h4>{alertaSeleccionada.titulo}</h4>
                <p><strong>Descripción:</strong> {alertaSeleccionada.descripcion}</p>
                <p><strong>Tipo:</strong> {alertaSeleccionada.tipo}</p>
                <p><strong>Prioridad:</strong> {alertaSeleccionada.prioridad}</p>
                <p><strong>Ubicación:</strong> {alertaSeleccionada.ubicacion}</p>
              </div>
              <div className="asignacion-info">
                <p><strong>Alerta:</strong> {alertaSeleccionada.titulo}</p>
                <div className="guardia-selection">
                  <label htmlFor="guardia">Seleccionar guardia:</label>
                  <select
                    id="guardia"
                    value={guardiaSeleccionado}
                    onChange={(e) => setGuardiaSeleccionado(e.target.value)}
                    className="guardia-select"
                  >
                    <option value="">-- Seleccionar guardia --</option>
                    {guardiasDisponibles.map(guardia => (
                      <option key={guardia.id} value={guardia.nombre}>
                        {guardia.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalAsignar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={confirmarAsignacion}
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Alerta */}
      {mostrarModalCerrar && alertaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Cerrar Alerta</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalCerrar(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <h4>{alertaSeleccionada.titulo}</h4>
                <p><strong>Descripción:</strong> {alertaSeleccionada.descripcion}</p>
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
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalCerrar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-cerrar"
                onClick={confirmarCierre}
              >
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles Alerta */}
      {mostrarModalDetalles && alertaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Detalles de Alerta</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalDetalles(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <h4>{alertaSeleccionada.titulo}</h4>
                <p><strong>Descripción:</strong> {alertaSeleccionada.descripcion}</p>
                <p><strong>Tipo:</strong> 
                  <span className="tipo-badge">{alertaSeleccionada.tipo}</span>
                </p>
                <p><strong>Prioridad:</strong> 
                  <span className={`badge ${getPrioridadBadgeClass(alertaSeleccionada.prioridad)}`}>
                    {alertaSeleccionada.prioridad}
                  </span>
                </p>
                <p><strong>Estado:</strong> 
                  <span className={`badge ${getEstadoBadgeClass(alertaSeleccionada.estado)}`}>
                    {alertaSeleccionada.estado}
                  </span>
                </p>
                <p><strong>Ubicación:</strong> {alertaSeleccionada.ubicacion}</p>
                <p><strong>Coordenadas:</strong> {alertaSeleccionada.latitud.toFixed(6)}, {alertaSeleccionada.longitud.toFixed(6)}</p>
                <p><strong>Reportado por:</strong> {alertaSeleccionada.reportadoPor}</p>
                <p><strong>Fecha de creación:</strong> {formatDate(alertaSeleccionada.fechaCreacion)}</p>
                {alertaSeleccionada.usuarioAsignado && (
                  <p><strong>Asignado a:</strong> {alertaSeleccionada.usuarioAsignado}</p>
                )}
                {alertaSeleccionada.fechaAsignacion && (
                  <p><strong>Fecha de asignación:</strong> {formatDate(alertaSeleccionada.fechaAsignacion)}</p>
                )}
                {alertaSeleccionada.fechaCierre && (
                  <p><strong>Fecha de cierre:</strong> {formatDate(alertaSeleccionada.fechaCierre)}</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalDetalles(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaAlertas;
