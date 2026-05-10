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

  useEffect(() => {
    const fetchGuardias = async () => {
      const result = await getGuardias();
      if (result.success) {
        const data = result.data;
        console.log('DEBUG ALERTAS: Guardias cargados desde servidor:', data);
        setGuardiasDisponibles(Array.isArray(data) ? data : []);
      } else {
        console.error('DEBUG ALERTAS: Error cargando guardias:', result.error);
        setGuardiasDisponibles([]);
      }
    };
    fetchGuardias();
  }, []);

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

  const normalizeAlerta = (alerta) => {
    if (!alerta) return null;

    const normalized = {
      ...alerta,
      titulo: alerta.motivo || alerta.Motivo || 'Sin título',
      descripcion: alerta.descripcion || alerta.Descripcion || 'Sin descripción',
      tipo: alerta.tipo || alerta.Tipo || 'General',
      prioridad: alerta.prioridad || alerta.Prioridad || 'Media',
      estado: alerta.estado || alerta.Estado || 'Desconocido',
      ubicacion: alerta.zona || alerta.Zona || 'Sin zona',
      latitud: alerta.latitud || alerta.Latitud,
      longitud: alerta.longitud || alerta.Longitud,
      reportadoPor: alerta.reportadoPor || alerta.ReportadoPor || 'Desconocido',
      fechaCreacion: alerta.creadaEn || alerta.CreadaEn,
      fechaCierre: alerta.cerradaEn || alerta.CerradaEn,
    };

    let guardiasIds = [];
    const rawGuardias = alerta.guardiasInvolucrados || alerta.GuardiasInvolucrados;
    if (typeof rawGuardias === 'string') {
      try { 
        const parsed = JSON.parse(rawGuardias);
        guardiasIds = Array.isArray(parsed) ? parsed.filter(id => id && String(id).trim() !== '') : []; 
      } catch(e) { guardiasIds = []; }
    } else if (Array.isArray(rawGuardias)) {
      guardiasIds = rawGuardias.filter(id => id && String(id).trim() !== '');
    }

    if (guardiasIds.length > 0) {
      const g = guardiasDisponibles.find(gd => String(gd.id) === String(guardiasIds[0]));
      normalized.usuarioAsignado = g ? g.nombre : `[ID: ${guardiasIds[0]}]`;
    } else {
      normalized.usuarioAsignado = 'Sin asignar';
    }

    return normalized;
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
    if (!onAsignar || !alertaSeleccionada) return;

    let finalId = '';
    let finalNombre = '';

    if (guardiaSeleccionado && typeof guardiaSeleccionado === 'object') {
      finalId = guardiaSeleccionado.id;
      finalNombre = guardiaSeleccionado.nombre;
    } else if (typeof guardiaSeleccionado === 'string' && guardiaSeleccionado !== '') {
      finalId = guardiaSeleccionado;
      console.log('IDs en alerta:', guardiasIds);
      console.log('Guardias disponibles:', guardiasDisponibles);
      const g = guardiasDisponibles.find(gd => String(gd.id) === String(id));
      finalNombre = g ? g.nombre : 'Guardia Desconocido';
    }

    if (finalId) {
      onAsignar(alertaSeleccionada.id, finalId, finalNombre);
      setMostrarModalAsignar(false);
      setAlertaSeleccionada(null);
      setGuardiaSeleccionado(null);
    } else {
      alert('Por favor, selecciona un guardia válido');
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
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
             {alertas.map(alerta => {
               const titulo = alerta.motivo || alerta.Motivo || 'Sin título';
               const estado = alerta.estado || alerta.Estado || 'Desconocido';
               const zona = alerta.zona || alerta.Zona || 'Sin zona';
               const fecha = alerta.creadaEn || alerta.CreadaEn;
               const fechaCierre = alerta.cerradaEn || alerta.CerradaEn;
               const tipo = alerta.tipo || 'General';
               const prioridad = alerta.prioridad || 'Media';

                 // Procesar guardias (filtramos IDs vacíos o nulos)
                 let guardiasIds = [];
                 const rawGuardias = alerta.guardiasInvolucrados || alerta.GuardiasInvolucrados;
                 if (typeof rawGuardias === 'string') {
                   try { 
                     const parsed = JSON.parse(rawGuardias);
                     guardiasIds = Array.isArray(parsed) ? parsed.filter(id => id && String(id).trim() !== '') : []; 
                   } catch(e) { guardiasIds = []; }
                 } else if (Array.isArray(rawGuardias)) {
                   guardiasIds = rawGuardias.filter(id => id && String(id).trim() !== '');
                 }


               console.log('IDs guardias de esta alerta:', guardiasIds);
console.log('Guardias disponibles:', guardiasDisponibles);
const guardiasNombres = guardiasIds.map(id => {
  const g = guardiasDisponibles.find(gd => String(gd.id) === String(id));
  return g ? g.nombre : `[ID: ${id}]`;
});


               return (
                 <tr key={alerta.id}>
                   <td className="titulo-cell">
                     <div className="alerta-titulo">
                       <span className="tipo-icon">{getTipoIcon(tipo)}</span>
                       {titulo}
                     </div>
                   </td>
                   <td>
                     <span className="tipo-badge">{tipo}</span>
                   </td>
                   <td>
                     <span className={`badge ${getPrioridadBadgeClass(prioridad)}`}>
                       {prioridad}
                     </span>
                   </td>
                   <td>
                     <span className={`badge ${getEstadoBadgeClass(estado)}`}>
                       {estado}
                     </span>
                   </td>
                   <td className="ubicacion-cell">
                     <div className="ubicacion-info">
                       <span className="ubicacion-icon">📍</span>
                       <span>{zona}</span>
                     </div>
                   </td>
                    <td>
                      {guardiasNombres.length > 0 ? (
                        <span className="usuario-asignado">{guardiasNombres[0]}</span>
                        ) : (
                        <span className="sin-asignar">Sin asignar</span>
                      )}
                    </td>

                   <td>
                     <div className="fecha-info">
                       <div className="fecha-creacion">
                         {formatDate(fecha)}
                       </div>
                       {fechaCierre && (
                         <div className="fecha-cierre">
                           Cerrada: {formatDate(fechaCierre)}
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
                       {estado === 'Activa' && (
                         <button
                           className="btn-accion btn-asignar"
                           onClick={() => handleAsignar(alerta)}
                         >
                           👤 Asignar
                         </button>
                       )}
                       {estado === 'Asignada' && (
                         <button
                           className="btn-accion btn-cerrar"
                           onClick={() => handleCerrar(alerta)}
                         >
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
                       <option key={guardia.id} value={guardia.id}>
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
     {/* Modal Detalles Alerta */}
{mostrarModalDetalles && alertaSeleccionada && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>Detalles de Alerta</h3>
        <button className="modal-close" onClick={() => setMostrarModalDetalles(false)}>×</button>
      </div>
      <div className="modal-body">
        <div className="alerta-detalle">
          <p><strong>Motivo:</strong> {alertaSeleccionada.motivo}</p>
          <p><strong>Estado:</strong>
            <span className={`badge ${getEstadoBadgeClass(alertaSeleccionada.estado)}`}>
              {alertaSeleccionada.estado}
            </span>
          </p>
          <p><strong>Zona:</strong> {alertaSeleccionada.zona}</p>
          <p><strong>Coordenadas:</strong> {alertaSeleccionada.latitud?.toFixed(6)}, {alertaSeleccionada.longitud?.toFixed(6)}</p>
          <p><strong>Reportado por:</strong> {alertaSeleccionada.nombreUsuario}</p>
          <p><strong>Rol:</strong> {alertaSeleccionada.rolUsuario}</p>
          {guardiasDisponibles.length > 0 && (() => {
  let ids = [];
  try { ids = JSON.parse(alertaSeleccionada.guardiasInvolucrados || '[]').filter(id => id && String(id).trim() !== ''); } catch(e) {}
  const nombres = ids.map(id => {
    const g = guardiasDisponibles.find(gd => String(gd.id) === String(id));
    return g ? g.nombre : `[ID: ${id}]`;
  });
  return nombres.length > 0 ? <p><strong>Guardia(s) involucrado(s):</strong> {nombres.join(', ')}</p> : null;
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
        <button className="btn btn-cancelar" onClick={() => setMostrarModalDetalles(false)}>
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
