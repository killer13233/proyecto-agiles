import { useState, useEffect, useRef } from 'react';
import { getUsuarios, cambiarRolUsuario, cambiarEstadoUsuario, getRolesValidos } from '../services/usuariosService';
import './Usuarios.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busquedaInput, setBusquedaInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModalRol, setMostrarModalRol] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [motivoDesactivacion, setMotivoDesactivacion] = useState('');
  const [accionCargando, setAccionCargando] = useState(false);

  const tamañoPagina = 10;
  const rolesValidos = getRolesValidos();

  useEffect(() => {
    cargarUsuarios();
  }, [paginaActual, busqueda]);

  // Debounce: esperar 300ms después de escribir para buscar
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBusqueda(busquedaInput);
      setPaginaActual(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busquedaInput]);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    const interval = setInterval(async () => {
      if (!isMounted.current) return;
      const resultado = await getUsuarios(paginaActual, tamañoPagina, busqueda);
      if (isMounted.current && resultado.success) {
        setUsuarios(resultado.data.items);
      }
    }, 10000);
    return () => { isMounted.current = false; clearInterval(interval); };
  }, [paginaActual, busqueda]);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    
    try {
      const resultado = await getUsuarios(paginaActual, tamañoPagina, busqueda);
      
      if (resultado.success) {
        setUsuarios(resultado.data.items);
        setTotalPaginas(Math.ceil(resultado.data.total / resultado.data.tamañoPagina));
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = async (usuario, nuevoRol) => {
    setAccionCargando(true);
    
    try {
      const resultado = await cambiarRolUsuario(usuario.id, nuevoRol);
      
      if (resultado.success) {
        // Actualizar usuario en la lista
        setUsuarios(prev => prev.map(u => 
          u.id === usuario.id ? { ...u, rol: nuevoRol } : u
        ));
        setMostrarModalRol(false);
        setUsuarioSeleccionado(null);
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cambiar el rol');
    } finally {
      setAccionCargando(false);
    }
  };

  const handleCambiarEstado = async (usuario, nuevoEstado) => {
    setAccionCargando(true);
    const motivo = nuevoEstado === 'Inactivo' ? motivoDesactivacion : null;
    
    try {
      const resultado = await cambiarEstadoUsuario(usuario.id, nuevoEstado, motivo);
      
      if (resultado.success) {
        setUsuarios(prev => prev.map(u => 
          u.id === usuario.id ? { ...u, estado: nuevoEstado, motivoDesactivacion: motivo } : u
        ));
        setMostrarModalEstado(false);
        setUsuarioSeleccionado(null);
        setMotivoDesactivacion('');
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cambiar el estado');
    } finally {
      setAccionCargando(false);
    }
  };

  const getRolBadgeClass = (rol) => {
    const clases = {
      'Administrador': 'badge-admin',
      'Guardia': 'badge-guardia',
      'Docente': 'badge-docente',
      'Personal Administrativo': 'badge-administrativo',
      'Estudiante': 'badge-estudiante'
    };
    return clases[rol] || 'badge-default';
  };

  const getEstadoBadgeClass = (estado) => {
    if (estado === 'Activo') return 'badge-activo';
    if (estado === 'Bloqueado') return 'badge-bloqueado';
    return 'badge-inactivo';
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Gestión de Usuarios</h1>
        <div className="usuarios-controls">
          <input
            type="text"
            placeholder="Buscar usuarios por nombre o correo..."
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>
                  <span className={`badge ${getRolBadgeClass(usuario.rol)}`}>
                    {usuario.rol}
                  </span>
                </td>
                <td>
                  <div className="estado-cell">
                    <span className={`badge ${getEstadoBadgeClass(usuario.estado)}`}>
                      {usuario.estado}
                    </span>
                    {usuario.estado !== 'Activo' && (
                      <span className="motivo-tooltip" title={usuario.motivoDesactivacion || (usuario.estado === 'Bloqueado' ? 'Cuenta bloqueada por 3 intentos fallidos de inicio de sesión.' : '')}>
                        ℹ️
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-rol"
                      onClick={() => {
                        setUsuarioSeleccionado(usuario);
                        setMostrarModalRol(true);
                      }}
                    >
                      Cambiar Rol
                    </button>
                    <button
                      className={`btn ${usuario.estado === 'Activo' ? 'btn-desactivar' : 'btn-activar'}`}
                      onClick={() => {
                        setUsuarioSeleccionado(usuario);
                        setMotivoDesactivacion(usuario.motivoDesactivacion || '');
                        setMostrarModalEstado(true);
                      }}
                    >
                      {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>
        <span className="pagination-info">
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          className="pagination-btn"
          onClick={() => cambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        >
          Siguiente
        </button>
      </div>

      {/* Modal Cambiar Rol */}
      {mostrarModalRol && usuarioSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Cambiar Rol</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarModalRol(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Cambiar el rol de <strong>{usuarioSeleccionado.nombre}</strong>?
              </p>
              <p>Rol actual: <span className="current-value">{usuarioSeleccionado.rol}</span></p>
              <select
                value={usuarioSeleccionado.rol}
                onChange={(e) => setUsuarioSeleccionado({...usuarioSeleccionado, rol: e.target.value})}
                className="modal-select"
              >
                {rolesValidos.map(rol => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalRol(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={() => handleCambiarRol(usuarioSeleccionado, usuarioSeleccionado.rol)}
                disabled={accionCargando}
              >
                {accionCargando ? 'Cambiando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {mostrarModalEstado && usuarioSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {usuarioSeleccionado.estado === 'Activo' ? 'Desactivar' : 'Activar'} Usuario
              </h3>
              <button
                className="modal-close"
                onClick={() => { setMostrarModalEstado(false); setMotivoDesactivacion(''); }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿{usuarioSeleccionado.estado === 'Activo' ? 'Desactivar' : 'Activar'} al usuario{' '}
                <strong>{usuarioSeleccionado.nombre}</strong>?
              </p>
              <div className="estado-info">
                <div className="estado-item">
                  <span className="estado-label">Estado actual:</span>
                  <span className={`badge ${getEstadoBadgeClass(usuarioSeleccionado.estado)}`}>
                    {usuarioSeleccionado.estado}
                  </span>
                </div>
                <div className="estado-item">
                  <span className="estado-label">Nuevo estado:</span>
                  <span className={`badge ${getEstadoBadgeClass(usuarioSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo')}`}>
                    {usuarioSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
              </div>

              {usuarioSeleccionado.estado === 'Activo' && (
                <div className="motivo-container">
                  <label htmlFor="motivo" className="motivo-label">
                    Motivo de desactivación
                  </label>
                  <textarea
                    id="motivo"
                    className="motivo-textarea"
                    placeholder="Explica por qué se desactiva esta cuenta..."
                    value={motivoDesactivacion}
                    onChange={(e) => setMotivoDesactivacion(e.target.value)}
                    rows={3}
                  />
                  <span className="motivo-hint">
                    Este mensaje se mostrará al usuario cuando intente iniciar sesión.
                  </span>
                </div>
              )}

              {usuarioSeleccionado.estado !== 'Activo' && (
                <div className="motivo-actual">
                  <span className="motivo-actual-label">Motivo:</span>
                  <p className="motivo-actual-texto">
                    {usuarioSeleccionado.motivoDesactivacion || 
                     (usuarioSeleccionado.estado === 'Bloqueado' 
                       ? 'Cuenta bloqueada por 3 intentos fallidos de inicio de sesión.' 
                       : 'Sin motivo registrado.')}
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => { setMostrarModalEstado(false); setMotivoDesactivacion(''); }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={() => handleCambiarEstado(usuarioSeleccionado, usuarioSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                disabled={accionCargando || (usuarioSeleccionado.estado === 'Activo' && !motivoDesactivacion.trim())}
              >
                {accionCargando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
