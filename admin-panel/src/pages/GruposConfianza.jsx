import { useState, useEffect } from 'react';
import {
  getGruposConfianza,
  getGrupoDetalle,
  actualizarGrupoConfianza,
  eliminarGrupoConfianza,
  agregarMiembroGrupo,
  quitarMiembroGrupo,
  buscarUsuariosGrupo,
} from '../services/gruposConfianzaService';
import './GruposConfianza.css';

const GruposConfianza = () => {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [gruposFiltrados, setGruposFiltrados] = useState([]);

  // Modals
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  // State
  const [grupoActual, setGrupoActual] = useState(null);
  const [grupoDetalle, setGrupoDetalle] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [accionCargando, setAccionCargando] = useState(false);

  // Búsqueda usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [resultadosUsuarios, setResultadosUsuarios] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);

  // ── Cargar grupos ───────────────────────────────────────────────────────
  useEffect(() => {
    cargarGrupos();
  }, []);

  useEffect(() => {
    const filtrados = grupos.filter(grupo =>
      grupo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      grupo.propietarioNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (grupo.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
    );
    setGruposFiltrados(filtrados);
  }, [busqueda, grupos]);

  const cargarGrupos = async () => {
    setLoading(true);
    setError('');
    try {
      const resultado = await getGruposConfianza();
      if (resultado.success) {
        setGrupos(resultado.data);
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al cargar los grupos de confianza');
    } finally {
      setLoading(false);
    }
  };

  // ── Detalle ─────────────────────────────────────────────────────────────
  const abrirDetalle = async (grupo) => {
    setGrupoActual(grupo);
    setShowDetalle(true);
    setBusquedaUsuario('');
    setResultadosUsuarios([]);
    const resultado = await getGrupoDetalle(grupo.id);
    if (resultado.success) {
      setGrupoDetalle(resultado.data);
    }
  };

  const recargarDetalle = async () => {
    if (!grupoActual) return;
    const resultado = await getGrupoDetalle(grupoActual.id);
    if (resultado.success) {
      setGrupoDetalle(resultado.data);
    }
  };

  // ── Editar ──────────────────────────────────────────────────────────────
  const abrirEditar = (grupo) => {
    setGrupoActual(grupo);
    setFormNombre(grupo.nombre);
    setFormDescripcion(grupo.descripcion || '');
    setShowEditar(true);
  };

  const handleEditar = async () => {
    if (!grupoActual || !formNombre.trim()) return;
    setAccionCargando(true);
    try {
      const resultado = await actualizarGrupoConfianza(
        grupoActual.id,
        formNombre,
        formDescripcion || null
      );
      if (resultado.success) {
        setShowEditar(false);
        setGrupoActual(null);
        cargarGrupos();
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al actualizar grupo');
    } finally {
      setAccionCargando(false);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────
  const abrirEliminar = (grupo) => {
    setGrupoActual(grupo);
    setShowEliminar(true);
  };

  const handleEliminar = async () => {
    if (!grupoActual) return;
    setAccionCargando(true);
    try {
      const resultado = await eliminarGrupoConfianza(grupoActual.id);
      if (resultado.success) {
        setShowEliminar(false);
        setGrupoActual(null);
        cargarGrupos();
      } else {
        setError(resultado.error);
      }
    } catch (err) {
      setError('Error al eliminar grupo');
    } finally {
      setAccionCargando(false);
    }
  };

  // ── Buscar usuarios ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!showDetalle || !grupoActual || busquedaUsuario.length < 2) {
      setResultadosUsuarios([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoUsuarios(true);
      const resultado = await buscarUsuariosGrupo(grupoActual.id, busquedaUsuario);
      if (resultado.success) {
        setResultadosUsuarios(resultado.data);
      }
      setBuscandoUsuarios(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [busquedaUsuario, showDetalle, grupoActual]);

  // ── Agregar miembro ─────────────────────────────────────────────────────
  const handleAgregarMiembro = async (usuarioId) => {
    if (!grupoActual) return;
    const resultado = await agregarMiembroGrupo(grupoActual.id, usuarioId);
    if (resultado.success) {
      setBusquedaUsuario('');
      setResultadosUsuarios([]);
      recargarDetalle();
      cargarGrupos();
    } else {
      setError(resultado.error);
    }
  };

  // ── Quitar miembro ──────────────────────────────────────────────────────
  const handleQuitarMiembro = async (miembroId) => {
    if (!grupoActual) return;
    const resultado = await quitarMiembroGrupo(grupoActual.id, miembroId);
    if (resultado.success) {
      recargarDetalle();
      cargarGrupos();
    } else {
      setError(resultado.error);
    }
  };

  // ── Estadísticas ────────────────────────────────────────────────────────
  const totalGrupos = grupos.length;
  const totalMiembros = grupos.reduce((acc, g) => acc + g.cantidadMiembros, 0);
  const propietariosUnicos = new Set(grupos.map(g => g.propietarioId)).size;

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grupos-admin-loading">
        <div className="grupos-admin-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando grupos de confianza...</p>
      </div>
    );
  }

  return (
    <div className="grupos-admin-container">
      {/* Header */}
      <div className="grupos-admin-header">
        <h1>Grupos de Confianza</h1>
        <div className="grupos-admin-controls">
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="grupos-admin-search"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="grupos-admin-error">
          <span>⚠️</span>
          {error}
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--accent-danger)',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grupos-admin-stats">
        <div className="grupos-stat-card">
          <div className="grupos-stat-icon blue">🤝</div>
          <div>
            <div className="grupos-stat-value">{totalGrupos}</div>
            <div className="grupos-stat-label">Total de grupos</div>
          </div>
        </div>
        <div className="grupos-stat-card">
          <div className="grupos-stat-icon green">👥</div>
          <div>
            <div className="grupos-stat-value">{totalMiembros}</div>
            <div className="grupos-stat-label">Total de miembros</div>
          </div>
        </div>
        <div className="grupos-stat-card">
          <div className="grupos-stat-icon purple">👤</div>
          <div>
            <div className="grupos-stat-value">{propietariosUnicos}</div>
            <div className="grupos-stat-label">Propietarios</div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="grupos-table-container">
        <table className="grupos-admin-table">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Propietario</th>
              <th>Miembros</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gruposFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="grupos-admin-empty">
                    <div className="grupos-admin-empty-icon">🤝</div>
                    <p>No se encontraron grupos</p>
                  </div>
                </td>
              </tr>
            ) : (
              gruposFiltrados.map(grupo => (
                <tr key={grupo.id}>
                  <td>
                    <strong>{grupo.nombre}</strong>
                  </td>
                  <td>
                    <div className="grupos-owner-cell">
                      <div className="grupos-owner-avatar">
                        {grupo.propietarioNombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="grupos-owner-name">{grupo.propietarioNombre}</span>
                    </div>
                  </td>
                  <td>
                    <div className="grupos-miembros-preview">
                      {grupo.miembrosPreview?.map(m => (
                        <span key={m.id} className="grupos-miembro-badge">
                          {m.nombre.split(' ')[0]}
                        </span>
                      ))}
                      {grupo.cantidadMiembros > 3 && (
                        <span className="grupos-miembro-badge more">
                          +{grupo.cantidadMiembros - 3}
                        </span>
                      )}
                      {grupo.cantidadMiembros === 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Sin miembros
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {grupo.descripcion || '—'}
                  </td>
                  <td>
                    <div className="grupos-admin-actions">
                      <button
                        className="grupos-admin-btn ver"
                        onClick={() => abrirDetalle(grupo)}
                      >
                        Ver
                      </button>
                      <button
                        className="grupos-admin-btn editar"
                        onClick={() => abrirEditar(grupo)}
                      >
                        Editar
                      </button>
                      <button
                        className="grupos-admin-btn eliminar"
                        onClick={() => abrirEliminar(grupo)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Detalle / Gestionar Miembros */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showDetalle && grupoActual && (
        <div className="grupos-admin-modal-overlay">
          <div className="grupos-admin-modal">
            <div className="grupos-admin-modal-header">
              <h3>{grupoActual.nombre}</h3>
              <button className="grupos-admin-modal-close" onClick={() => setShowDetalle(false)}>×</button>
            </div>
            <div className="grupos-admin-modal-body">
              {/* Info */}
              <p>
                <strong>Propietario:</strong> {grupoActual.propietarioNombre}<br />
                <strong>Descripción:</strong> {grupoActual.descripcion || 'Sin descripción'}
              </p>

              {/* Buscar y agregar */}
              <div className="grupos-admin-detail-section">
                <h4>Agregar miembros</h4>
                <div className="grupos-admin-search-area">
                  <input
                    className="grupos-admin-search-mini"
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                  />
                </div>

                {buscandoUsuarios && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                    Buscando...
                  </p>
                )}

                {resultadosUsuarios.length > 0 && (
                  <div className="grupos-admin-result-list">
                    {resultadosUsuarios.map(u => (
                      <div key={u.id} className="grupos-admin-result-item">
                        <div className="grupos-admin-result-info">
                          <div className="grupos-admin-result-avatar">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="grupos-admin-result-name">{u.nombre}</div>
                            <div className="grupos-admin-result-role">{u.rol} · {u.correo}</div>
                          </div>
                        </div>
                        <button
                          className="grupos-admin-add-btn"
                          onClick={() => handleAgregarMiembro(u.id)}
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de miembros */}
              <div className="grupos-admin-detail-section">
                <h4>Miembros actuales ({grupoDetalle?.cantidadMiembros ?? 0})</h4>
                {grupoDetalle && grupoDetalle.miembros.length > 0 ? (
                  <div className="grupos-admin-member-list">
                    {grupoDetalle.miembros.map(m => (
                      <div key={m.id} className="grupos-admin-member-row">
                        <div className="grupos-admin-member-info">
                          <div className="grupos-admin-member-avatar">
                            {m.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="grupos-admin-member-name">{m.nombre}</div>
                            <div className="grupos-admin-member-role">{m.rol} · {m.correo}</div>
                          </div>
                        </div>
                        <button
                          className="grupos-admin-remove-btn"
                          onClick={() => handleQuitarMiembro(m.usuarioId)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                    Sin miembros
                  </p>
                )}
              </div>
            </div>
            <div className="grupos-admin-modal-footer">
              <button className="btn btn-confirmar" onClick={() => setShowDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Editar */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showEditar && grupoActual && (
        <div className="grupos-admin-modal-overlay">
          <div className="grupos-admin-modal">
            <div className="grupos-admin-modal-header">
              <h3>Editar Grupo</h3>
              <button className="grupos-admin-modal-close" onClick={() => setShowEditar(false)}>×</button>
            </div>
            <div className="grupos-admin-modal-body">
              <div className="grupos-admin-form-group">
                <label>Nombre del grupo</label>
                <input
                  className="grupos-admin-input"
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="grupos-admin-form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  className="grupos-admin-textarea"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  maxLength={250}
                />
              </div>
            </div>
            <div className="grupos-admin-modal-footer">
              <button className="btn btn-cancelar" onClick={() => setShowEditar(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-confirmar"
                onClick={handleEditar}
                disabled={!formNombre.trim() || accionCargando}
              >
                {accionCargando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Eliminar */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showEliminar && grupoActual && (
        <div className="grupos-admin-modal-overlay">
          <div className="grupos-admin-modal">
            <div className="grupos-admin-modal-header">
              <h3>Eliminar Grupo</h3>
              <button className="grupos-admin-modal-close" onClick={() => setShowEliminar(false)}>×</button>
            </div>
            <div className="grupos-admin-modal-body">
              <p style={{ textAlign: 'center', fontSize: '2.5rem' }}>⚠️</p>
              <p style={{ textAlign: 'center' }}>
                ¿Estás seguro de eliminar el grupo <strong>{grupoActual.nombre}</strong>?<br />
                Se eliminarán todos los miembros asociados.
              </p>
            </div>
            <div className="grupos-admin-modal-footer">
              <button className="btn btn-cancelar" onClick={() => setShowEliminar(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-desactivar"
                onClick={handleEliminar}
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

export default GruposConfianza;
