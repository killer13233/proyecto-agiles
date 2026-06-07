import { useState, useEffect } from 'react';
import { getZonas, crearZona, actualizarZona, eliminarZona, cambiarEstadoZona, verificarPuntoEnZona, crearCamara } from '../services/zonasService';
import MapaZonas from '../components/MapaZonas';
import './Zonas.css';

const Zonas = () => {
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [accionCargando, setAccionCargando] = useState(false);
  const [modoVista, setModoVista] = useState('mapa'); // 'mapa' o 'lista'
  const [modoCreacion, setModoCreacion] = useState(false);
  const [modoCamara, setModoCamara] = useState(false);
  const [camaraKey, setCamaraKey] = useState(0);
  const [mostrarModalCamara, setMostrarModalCamara] = useState(false);
  const [coordenadasCamara, setCoordenadasCamara] = useState({ lat: 0, lng: 0 });
  const [zonaCamara, setZonaCamara] = useState(null);
  const [formularioCamara, setFormularioCamara] = useState({ nombre: '', facultad: '', posicion: '' });
  const [colorZonaSeleccionada, setColorZonaSeleccionada] = useState('#10b981');

  // Formulario para crear/editar
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    poligono: '[]',
    color: '#10b981',
    estado: 'Activa'
  });

  const normalizeZona = (zona) => {
    if (!zona) return null;

    let poligonoStr = zona.poligono || zona.Poligono || '[]';

    return {
      ...zona,
      nombre: zona.nombre || zona.Nombre || 'Sin nombre',
      descripcion: zona.descripcion || zona.Descripcion || 'Sin descripción',
      estado: zona.estado || zona.Estado || 'Activa',
      color: zona.color || zona.Color || '#10b981',
      poligono: poligonoStr,
    };
  };

  useEffect(() => {
    cargarZonas();
  }, []);

  const cargarZonas = async () => {
    setLoading(true);
    setError('');
    
    try {
      const resultado = await getZonas();
      
      if (resultado.success) {
        const normalizedZonas = Array.isArray(resultado.data) 
          ? resultado.data.map(normalizeZona) 
          : [];
        setZonas(normalizedZonas);
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClick = async (lat, lng) => {
    setZonaSeleccionada(null);
    setCoordenadasCamara({ lat, lng });
    const resultado = await verificarPuntoEnZona(lat, lng);
    if (resultado.success && resultado.data.dentroDelCampus) {
      const zonaEncontrada = zonas.find(z => z.nombre === resultado.data.zona);
      if (zonaEncontrada) {
        setZonaCamara(zonaEncontrada);
        setFormularioCamara({ nombre: '', facultad: zonaEncontrada.nombre, posicion: '' });
        setMostrarModalCamara(true);
      } else {
        setError('Zona encontrada pero no está en la lista local');
        setModoCamara(false);
      }
    } else {
      setError('❌ La cámara debe estar dentro de una zona');
      setModoCamara(false);
    }
  };

  const handleCrearCamara = async () => {
    if (!formularioCamara.nombre) {
      setError('Por ingresa un nombre para la cámara');
      return;
    }
    setAccionCargando(true);
    try {
      const resultado = await crearCamara({
        nombre: formularioCamara.nombre,
        facultad: formularioCamara.facultad,
        posicion: formularioCamara.posicion || 'S/N',
        latitud: coordenadasCamara.lat,
        longitud: coordenadasCamara.lng,
        zonaId: zonaCamara.id
      });
      if (resultado.success) {
        setMostrarModalCamara(false);
        setModoCamara(false);
        setCamaraKey(k => k + 1);
        setError('');
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al crear la cámara');
    } finally {
      setAccionCargando(false);
    }
  };

  const handleMapClick = (poligono) => {
    setFormulario(prev => ({
      ...prev,
      poligono: JSON.stringify(poligono)
    }));
    // Abrir modal automáticamente en modo de creación
    setMostrarModalCrear(true);
  };

  const handleCrearZona = async () => {
    if (!formulario.nombre || !formulario.descripcion) {
      setError('Por favor completa todos los campos');
      return;
    }

    setAccionCargando(true);
    
    try {
      const resultado = await crearZona(formulario);
      
      if (resultado.success) {
        setZonas(prev => [...prev, normalizeZona(resultado.data)]);
        setMostrarModalCrear(false);
        resetFormulario();
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al crear la zona');
    } finally {
      setAccionCargando(false);
    }
  };

  const handleActualizarZona = async () => {
    if (!formulario.nombre || !formulario.descripcion) {
      setError('Por favor completa todos los campos');
      return;
    }

    setAccionCargando(true);
    
    try {
      const resultado = await actualizarZona(zonaSeleccionada.id, formulario);
      
      if (resultado.success) {
        setZonas(prev => prev.map(z => 
          z.id === zonaSeleccionada.id ? { ...z, ...formulario } : z
        ));
        setMostrarModalEditar(false);
        setZonaSeleccionada(null);
        resetFormulario();
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al actualizar la zona');
    } finally {
      setAccionCargando(false);
    }
  };

  const handleEliminarZona = async () => {
    setAccionCargando(true);
    
    try {
      const resultado = await eliminarZona(zonaSeleccionada.id);
      
      if (resultado.success) {
        setZonas(prev => prev.filter(z => z.id !== zonaSeleccionada.id));
        setMostrarModalEliminar(false);
        setZonaSeleccionada(null);
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al eliminar la zona');
    } finally {
      setAccionCargando(false);
    }
  };

  const handleCambiarEstado = async (zona, nuevoEstado) => {
    try {
      const resultado = await cambiarEstadoZona(zona.id, nuevoEstado);
      
      if (resultado.success) {
        setZonas(prev => prev.map(z => 
          z.id === zona.id ? { ...z, estado: nuevoEstado } : z
        ));
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cambiar el estado de la zona');
    }
  };

  const handleActualizarZonaColor = async (id, nuevoColor) => {
    try {
      const zona = zonas.find(z => z.id === id);
      if (!zona) return;

      const resultado = await actualizarZona(id, {
        ...zona,
        color: nuevoColor
      });

      if (resultado.success) {
        setZonas(prev => prev.map(z => 
          z.id === id ? { ...z, color: nuevoColor } : z
        ));
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al actualizar el color de la zona');
    }
  };

  const resetFormulario = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      poligono: '[]',
      color: '#10b981',
      estado: 'Activa'
    });
  };

  const abrirModalEditar = (zona) => {
    setZonaSeleccionada(zona);
    setColorZonaSeleccionada(zona.color || '#10b981');
    setFormulario({
      nombre: zona.nombre,
      descripcion: zona.descripcion,
      poligono: zona.poligono,
      color: zona.color || '#10b981',
      estado: zona.estado
    });
    setMostrarModalEditar(true);
  };

  const abrirModalEliminar = (zona) => {
    setZonaSeleccionada(zona);
    setMostrarModalEliminar(true);
  };

  const handleZonaClick = (zona) => {
    setZonaSeleccionada(zona);
    setColorZonaSeleccionada(zona.color || '#10b981');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando zonas...</p>
      </div>
    );
  }

  return (
    <div className="zonas-container">

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Vista de Mapa */}
      {modoVista === 'mapa' && (
        <div className="mapa-wrapper">
          <div className="mapa-container">
            <MapaZonas
              zonas={zonas}
              zonaSeleccionada={zonaSeleccionada}
              onZonaClick={handleZonaClick}
              onMapClick={handleMapClick}
              onCameraClick={handleCameraClick}
              modoCreacion={modoCreacion}
              modoCamara={modoCamara}
              colorZona={colorZonaSeleccionada}
              camaraRefreshKey={camaraKey}
            />
          </div>
          
          <div className="zonas-panel">
            <div className="zonas-panel-header">
              <h3>Zonas Definidas</h3>
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${modoVista === 'mapa' ? 'active' : ''}`}
                  onClick={() => setModoVista('mapa')}
                >
                  🗺️ Mapa
                </button>
                <button
                  className={`toggle-btn ${modoVista === 'lista' ? 'active' : ''}`}
                  onClick={() => setModoVista('lista')}
                >
                  📋 Lista
                </button>
              </div>
            </div>
            <div className="creation-controls">
              <button
                className={`btn ${modoCreacion ? 'btn-crear-activo' : 'btn-crear'}`}
                onClick={() => { setModoCreacion(!modoCreacion); setModoCamara(false); }}
              >
                {modoCreacion ? '🛑 Cancelar Creación' : '📍 Crear Zona'}
              </button>
              <button
                className={`btn ${modoCamara ? 'btn-crear-activo' : 'btn-primary'}`}
                onClick={() => { setModoCamara(!modoCamara); setModoCreacion(false); }}
              >
                {modoCamara ? '🛑 Cancelar Cámara' : '📷 Añadir Cámara'}
              </button>
            </div>
            <div className="zonas-list">
              {zonas.map(zona => (
                    <div
                      key={zona.id}
                      className={`zona-item ${zonaSeleccionada?.id === zona.id ? 'selected' : ''}`}
                      onClick={() => handleZonaClick(zona)}
                    >

                  <div className="zona-item-header">
                    <span className="zona-item-title">{zona.nombre}</span>
                    <span className={`zona-item-estado ${zona.estado?.toLowerCase() || 'activa'}`}>
                      {zona.estado || 'Activa'}
                    </span>
                  </div>
                    <div className="zona-item-details">
                      {zona.descripcion || 'Sin descripción'}
                    </div>
                </div>
              ))}
            </div>
            
            {zonaSeleccionada && (
              <div className="zona-seleccionada-info">
                <h4>{zonaSeleccionada.nombre}</h4>
                 <p><strong>Descripción:</strong> {zonaSeleccionada.descripcion || 'Sin descripción'}</p>
                 <p><strong>Estado:</strong> 
                   <span className={`badge ${zonaSeleccionada.estado === 'Activa' ? 'badge-activo' : 'badge-inactivo'}`}>
                     {zonaSeleccionada.estado || 'Activa'}
                   </span>
                 </p>
                 <div className="zona-actions-panel">
                   <button className="btn btn-editar" onClick={() => abrirModalEditar(zonaSeleccionada)}>
                     ✏️ Editar
                   </button>
                   <button className="btn btn-eliminar" onClick={() => abrirModalEliminar(zonaSeleccionada)}>
                     🗑️ Eliminar
                   </button>
                 </div>
                  <div className="color-selector">
                    <label>Color de la Zona:</label>
                    <div className="color-options">
                      {[
                        { color: '#10b981', label: 'Verde' },
                        { color: '#ef4444', label: 'Rojo' },
                        { color: '#2563eb', label: 'Azul' },
                        { color: '#f59e0b', label: 'Amarillo' },
                        { color: '#8b5cf6', label: 'Morado' },
                        { color: '#6b7280', label: 'Gris' },
                      ].map(opt => (
                        <div
                          key={opt.color}
                          className={`color-option ${colorZonaSeleccionada === opt.color ? 'selected' : ''}`}
                          onClick={async () => {
                            setColorZonaSeleccionada(opt.color);
                            await handleActualizarZonaColor(zonaSeleccionada.id, opt.color);
                          }}
                          title={opt.label}
                          style={{ backgroundColor: opt.color }}
                        />
                      ))}
                    </div>
                  </div>

               </div>
             )}

          </div>
        </div>
      )}

      {/* Vista de Lista */}
      {modoVista === 'lista' && (
        <div className="lista-zonas">
          <div className="view-toggle list-view-toggle">
            <button
              className={`toggle-btn ${modoVista === 'mapa' ? 'active' : ''}`}
              onClick={() => setModoVista('mapa')}
            >
              🗺️ Mapa
            </button>
            <button
              className={`toggle-btn ${modoVista === 'lista' ? 'active' : ''}`}
              onClick={() => setModoVista('lista')}
            >
              📋 Lista
            </button>
          </div>
          <div className="zonas-grid">
            {zonas.map(zona => (
              <div key={zona.id} className="zona-card">
                <div className="zona-card-header">
                  <h3>{zona.nombre}</h3>
                  <span className={`badge ${zona.estado === 'Activa' ? 'badge-activo' : 'badge-inactivo'}`}>
                    {zona.estado}
                  </span>
                </div>
                 <div className="zona-card-body">
                   <p>{zona.descripcion}</p>
                   <div className="zona-details">
                     <p><strong>Color:</strong> {zona.color || 'No definido'}</p>
                     <p><strong>Tipo:</strong> Polígono GeoJSON</p>
                   </div>
                 </div>

                <div className="zona-card-actions">
                  <button
                    className="btn btn-editar"
                    onClick={() => abrirModalEditar(zona)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className={`btn ${zona.estado === 'Activa' ? 'btn-desactivar' : 'btn-activar'}`}
                    onClick={() => handleCambiarEstado(zona, zona.estado === 'Activa' ? 'Inactiva' : 'Activa')}
                  >
                    {zona.estado === 'Activa' ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="btn btn-eliminar"
                    onClick={() => abrirModalEliminar(zona)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear Zona */}
      {mostrarModalCrear && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Crear Nueva Zona</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalCrear(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de la Zona</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({...formulario, nombre: e.target.value})}
                  placeholder="Ej: Zona A - Facultad de Ingeniería"
                  className="modal-input"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}
                  placeholder="Describe el área que cubre esta zona..."
                  className="modal-textarea"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={formulario.estado}
                  onChange={(e) => setFormulario({...formulario, estado: e.target.value})}
                  className="modal-select"
                >
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color de la Zona</label>
                <div className="color-options-modal">
                  {[
                    { color: '#10b981', label: 'Verde' },
                    { color: '#ef4444', label: 'Rojo' },
                    { color: '#2563eb', label: 'Azul' },
                    { color: '#f59e0b', label: 'Amarillo' },
                    { color: '#8b5cf6', label: 'Morado' },
                    { color: '#6b7280', label: 'Gris' },
                  ].map(opt => (
                    <div 
                      key={opt.color}
                      className={`color-option-modal ${formulario.color === opt.color ? 'selected' : ''}`}
                      onClick={() => setFormulario({...formulario, color: opt.color})}
                      title={opt.label}
                      style={{ backgroundColor: opt.color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalCrear(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={handleCrearZona}
                disabled={accionCargando}
              >
                {accionCargando ? 'Creando...' : 'Crear Zona'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Zona */}
      {mostrarModalEditar && zonaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Editar Zona</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalEditar(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de la Zona</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({...formulario, nombre: e.target.value})}
                  className="modal-input"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}
                  className="modal-textarea"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={formulario.estado}
                  onChange={(e) => setFormulario({...formulario, estado: e.target.value})}
                  className="modal-select"
                >
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color de la Zona</label>
                <div className="color-options-modal">
                  {[
                    { color: '#10b981', label: 'Verde' },
                    { color: '#ef4444', label: 'Rojo' },
                    { color: '#2563eb', label: 'Azul' },
                    { color: '#f59e0b', label: 'Amarillo' },
                    { color: '#8b5cf6', label: 'Morado' },
                    { color: '#6b7280', label: 'Gris' },
                  ].map(opt => (
                    <div 
                      key={opt.color}
                      className={`color-option-modal ${formulario.color === opt.color ? 'selected' : ''}`}
                      onClick={() => setFormulario({...formulario, color: opt.color})}
                      title={opt.label}
                      style={{ backgroundColor: opt.color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalEditar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={handleActualizarZona}
                disabled={accionCargando}
              >
                {accionCargando ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Cámara */}
      {mostrarModalCamara && zonaCamara && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>📷 Añadir Cámara</h3>
              <button className="modal-close" onClick={() => { setMostrarModalCamara(false); setModoCamara(false); }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Ubicación: {coordenadasCamara.lat.toFixed(6)}, {coordenadasCamara.lng.toFixed(6)}
              </p>
              <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Zona detectada: <strong>{zonaCamara.nombre}</strong>
              </p>
              <div className="form-group">
                <label>Nombre de la cámara</label>
                <input
                  type="text"
                  value={formularioCamara.nombre}
                  onChange={(e) => setFormularioCamara({...formularioCamara, nombre: e.target.value})}
                  placeholder="Ej: FISEI - Bloque 1 Entrada"
                  className="modal-input"
                />
              </div>
              <div className="form-group">
                <label>Facultad / Área</label>
                <input
                  type="text"
                  value={formularioCamara.facultad}
                  onChange={(e) => setFormularioCamara({...formularioCamara, facultad: e.target.value})}
                  className="modal-input"
                />
              </div>
              <div className="form-group">
                <label>Posición (opcional)</label>
                <input
                  type="text"
                  value={formularioCamara.posicion}
                  onChange={(e) => setFormularioCamara({...formularioCamara, posicion: e.target.value})}
                  placeholder="Ej: Bloque 1 Inf-Este"
                  className="modal-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => { setMostrarModalCamara(false); setModoCamara(false); }}>
                Cancelar
              </button>
              <button className="btn btn-confirmar" onClick={handleCrearCamara} disabled={accionCargando}>
                {accionCargando ? 'Creando...' : 'Crear Cámara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Zona */}
      {mostrarModalEliminar && zonaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar Zona</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalEliminar(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar la zona <strong>{zonaSeleccionada.nombre}</strong>?</p>
              <p className="warning-text">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalEliminar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-eliminar"
                onClick={handleEliminarZona}
                disabled={accionCargando}
              >
                {accionCargando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zonas;
