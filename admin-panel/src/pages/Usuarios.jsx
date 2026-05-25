import { useState, useEffect } from 'react';
import { getUsuarios, cambiarRolUsuario, cambiarEstadoUsuario, getRolesValidos } from '../services/usuariosService';
import './Usuarios.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModalRol, setMostrarModalRol] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [accionCargando, setAccionCargando] = useState(false);

  const tamañoPagina = 10;
  const rolesValidos = getRolesValidos();

  useEffect(() => {
    cargarUsuarios();
  }, [paginaActual]);

  useEffect(() => {
    const filtrados = usuarios.filter(usuario =>
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(busqueda.toLowerCase())
    );
    setUsuariosFiltrados(filtrados);
  }, [busqueda, usuarios]);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    
    try {
      const resultado = await getUsuarios(paginaActual, tamañoPagina);
      
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
    
    try {
      const resultado = await cambiarEstadoUsuario(usuario.id, nuevoEstado);
      
      if (resultado.success) {
        // Actualizar usuario en la lista
        setUsuarios(prev => prev.map(u => 
          u.id === usuario.id ? { ...u, estado: nuevoEstado } : u
        ));
        setMostrarModalEstado(false);
        setUsuarioSeleccionado(null);
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
    return estado === 'Activo' ? 'badge-activo' : 'badge-inactivo';
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
            placeholder="Buscar usuarios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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
              <th>Zona</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(usuario => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>
                  <span className={`badge ${getRolBadgeClass(usuario.rol)}`}>
                    {usuario.rol}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getEstadoBadgeClass(usuario.estado)}`}>
                    {usuario.estado}
                  </span>
                </td>
                <td>{usuario.zona}</td>
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
                onClick={() => setMostrarModalEstado(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿{usuarioSeleccionado.estado === 'Activo' ? 'Desactivar' : 'Activar'} al usuario{' '}
                <strong>{usuarioSeleccionado.nombre}</strong>?
              </p>
              <p>
                Estado actual: <span className={`badge ${getEstadoBadgeClass(usuarioSeleccionado.estado)}`}>
                  {usuarioSeleccionado.estado}
                </span>
              </p>
              <p>
                Nuevo estado: <span className={`badge ${getEstadoBadgeClass(usuarioSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo')}`}>
                  {usuarioSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo'}
                </span>
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarModalEstado(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={() => handleCambiarEstado(usuarioSeleccionado, usuarioSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                disabled={accionCargando}
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
