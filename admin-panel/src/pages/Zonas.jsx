import { useState, useEffect } from 'react';
import { getZonas, crearZona, actualizarZona, eliminarZona, cambiarEstadoZona } from '../services/zonasService';
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
  const [modoCreacion, setModoCreacion] = useState(false); // Nuevo modo de creación fácil
  const [colorZonaSeleccionada, setColorZonaSeleccionada] = useState('#10b981'); // Color del círculo

  // Formulario para crear/editar
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    latitud: -1.2687,
    longitud: -78.62434,
    radio: 200,
    estado: 'Activa'
  });

  useEffect(() => {
    cargarZonas();
  }, []);

  const cargarZonas = async () => {
    setLoading(true);
    setError('');
    
    try {
      const resultado = await getZonas();
      
      if (resultado.success) {
        setZonas(resultado.data);
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = ({ latitud, longitud }) => {
    setFormulario(prev => ({
      ...prev,
      latitud,
      longitud
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
        setZonas(prev => [...prev, resultado.data]);
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
          z.id === zonaSeleccionada.id ? resultado.data : z
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

  const resetFormulario = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      latitud: -0.180653,
      longitud: -78.467838,
      radio: 200,
      estado: 'Activa'
    });
  };

  const abrirModalEditar = (zona) => {
    setZonaSeleccionada(zona);
    setFormulario({
      nombre: zona.nombre,
      descripcion: zona.descripcion,
      latitud: zona.latitud,
      longitud: zona.longitud,
      radio: zona.radio,
      estado: zona.estado
    });
    setMostrarModalEditar(true);
  };

  const abrirModalEliminar = (zona) => {
    setZonaSeleccionada(zona);
    setMostrarModalEliminar(true);
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
      <div className="zonas-header">
        <h1>Gestión de Zonas</h1>
        <div className="zonas-controls">
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
          <div className="creation-controls">
            <button
              className={`btn ${modoCreacion ? 'btn-crear-activo' : 'btn-crear'}`}
              onClick={() => setModoCreacion(!modoCreacion)}
            >
              {modoCreacion ? '🛑 Cancelar Creación' : '📍 Crear con Click'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetFormulario();
                setMostrarModalCrear(true);
                setModoCreacion(false);
              }}
            >
              ➕ Añadir Manual
            </button>
          </div>
        </div>
      </div>

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
              onZonaClick={setZonaSeleccionada}
              onMapClick={handleMapClick}
              modoCreacion={modoCreacion}
              colorZona={colorZonaSeleccionada}
            />
          </div>
          
          <div className="zonas-panel">
            <div className="zonas-panel-header">
              <h3>Zonas Definidas</h3>
            </div>
            <div className="zonas-list">
              {zonas.map(zona => (
                <div
                  key={zona.id}
                  className={`zona-item ${zonaSeleccionada?.id === zona.id ? 'selected' : ''}`}
                  onClick={() => setZonaSeleccionada(zona)}
                >
                  <div className="zona-item-header">
                    <span className="zona-item-title">{zona.nombre}</span>
                    <span className={`zona-item-estado ${zona.estado.toLowerCase()}`}>
                      {zona.estado}
                    </span>
                  </div>
                  <div className="zona-item-details">
                    {zona.descripcion}
                  </div>
                </div>
              ))}
            </div>
            
            {zonaSeleccionada && (
              <div className="zona-seleccionada-info">
                <h4>{zonaSeleccionada.nombre}</h4>
                <p><strong>Descripción:</strong> {zonaSeleccionada.descripcion}</p>
                <p><strong>Coordenadas:</strong> {zonaSeleccionada.latitud.toFixed(6)}, {zonaSeleccionada.longitud.toFixed(6)}</p>
                <p><strong>Radio:</strong> {zonaSeleccionada.radio}m</p>
                <p><strong>Estado:</strong> 
                  <span className={`badge ${zonaSeleccionada.estado === 'Activa' ? 'badge-activo' : 'badge-inactivo'}`}>
                    {zonaSeleccionada.estado}
                  </span>
                </p>
                <div className="color-selector">
                  <label>Color del círculo:</label>
                  <div className="color-options">
                    <div
                      className={`color-option color-verde ${colorZonaSeleccionada === '#10b981' ? 'selected' : ''}`}
                      onClick={() => setColorZonaSeleccionada('#10b981')}
                      title="Verde"
                    />
                    <div
                      className={`color-option color-rojo ${colorZonaSeleccionada === '#ef4444' ? 'selected' : ''}`}
                      onClick={() => setColorZonaSeleccionada('#ef4444')}
                      title="Rojo"
                    />
                    <div
                      className={`color-option color-azul ${colorZonaSeleccionada === '#2563eb' ? 'selected' : ''}`}
                      onClick={() => setColorZonaSeleccionada('#2563eb')}
                      title="Azul"
                    />
                    <div
                      className={`color-option color-amarillo ${colorZonaSeleccionada === '#f59e0b' ? 'selected' : ''}`}
                      onClick={() => setColorZonaSeleccionada('#f59e0b')}
                      title="Amarillo"
                    />
                    <div
                      className={`color-option color-morado ${colorZonaSeleccionada === '#8b5cf6' ? 'selected' : ''}`}
                      onClick={() => setColorZonaSeleccionada('#8b5cf6')}
                      title="Morado"
                    />
                    <div
                      className={`color-option color-gris ${colorZonaSeleccionada === '#6b7280' ? 'selected' : ''}`}
                      onClick={() => setColorZonaSeleccionada('#6b7280')}
                      title="Gris"
                    />
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
                    <p><strong>Latitud:</strong> {zona.latitud.toFixed(6)}</p>
                    <p><strong>Longitud:</strong> {zona.longitud.toFixed(6)}</p>
                    <p><strong>Radio:</strong> {zona.radio}m</p>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formulario.latitud}
                    onChange={(e) => setFormulario({...formulario, latitud: parseFloat(e.target.value)})}
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label>Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formulario.longitud}
                    onChange={(e) => setFormulario({...formulario, longitud: parseFloat(e.target.value)})}
                    className="modal-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Radio (metros)</label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  value={formulario.radio}
                  onChange={(e) => setFormulario({...formulario, radio: parseInt(e.target.value)})}
                  className="modal-input"
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
              <div className="form-row">
                <div className="form-group">
                  <label>Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formulario.latitud}
                    onChange={(e) => setFormulario({...formulario, latitud: parseFloat(e.target.value)})}
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label>Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formulario.longitud}
                    onChange={(e) => setFormulario({...formulario, longitud: parseFloat(e.target.value)})}
                    className="modal-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Radio (metros)</label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  value={formulario.radio}
                  onChange={(e) => setFormulario({...formulario, radio: parseInt(e.target.value)})}
                  className="modal-input"
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
