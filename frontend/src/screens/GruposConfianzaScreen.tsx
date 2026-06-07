import { useState, useEffect, useCallback } from "react";
import { IonContent, IonPage } from "@ionic/react";
import {
  listarMisGrupos,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,
  obtenerGrupo,
  agregarMiembro,
  quitarMiembro,
  buscarUsuarios,
} from "../services/gruposConfianzaService";
import "./GruposConfianzaScreen.css";

type Props = {
  onVolver: () => void;
};

type MiembroPreview = {
  id: number;
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: string;
  agregadoEn: string;
};

type GrupoResumen = {
  id: number;
  nombre: string;
  descripcion: string | null;
  propietarioId: number;
  propietarioNombre: string;
  cantidadMiembros: number;
  miembrosPreview: MiembroPreview[];
  creadoEn: string;
};

type GrupoDetalle = {
  id: number;
  nombre: string;
  descripcion: string | null;
  propietarioId: number;
  propietarioNombre: string;
  cantidadMiembros: number;
  miembros: MiembroPreview[];
  creadoEn: string;
};

type UsuarioBusqueda = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

const GruposConfianzaScreen: React.FC<Props> = ({ onVolver }) => {
  // ── State ───────────────────────────────────────────────────────────────
  const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [showCrear, setShowCrear] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);

  // Form
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [grupoActual, setGrupoActual] = useState<GrupoResumen | null>(null);
  const [grupoDetalle, setGrupoDetalle] = useState<GrupoDetalle | null>(null);
  const [saving, setSaving] = useState(false);

  // Búsqueda usuarios
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<UsuarioBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

  // ── Cargar grupos ───────────────────────────────────────────────────────
  const cargarGrupos = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await listarMisGrupos();
    if (res.success) {
      setGrupos(res.data);
    } else {
      setError(res.error || "Error al cargar grupos");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarGrupos();
  }, [cargarGrupos]);

  // ── Crear ───────────────────────────────────────────────────────────────
  const handleCrear = async () => {
    if (!formNombre.trim()) return;
    setSaving(true);
    const res = await crearGrupo(formNombre, formDescripcion || undefined);
    setSaving(false);
    if (res.success) {
      setShowCrear(false);
      setFormNombre("");
      setFormDescripcion("");
      cargarGrupos();
    } else {
      setError(res.error || "Error al crear grupo");
    }
  };

  // ── Editar ──────────────────────────────────────────────────────────────
  const abrirEditar = (grupo: GrupoResumen) => {
    setGrupoActual(grupo);
    setFormNombre(grupo.nombre);
    setFormDescripcion(grupo.descripcion || "");
    setShowEditar(true);
  };

  const handleEditar = async () => {
    if (!grupoActual || !formNombre.trim()) return;
    setSaving(true);
    const res = await actualizarGrupo(
      grupoActual.id,
      formNombre,
      formDescripcion || undefined
    );
    setSaving(false);
    if (res.success) {
      setShowEditar(false);
      setGrupoActual(null);
      setFormNombre("");
      setFormDescripcion("");
      cargarGrupos();
    } else {
      setError(res.error || "Error al editar grupo");
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────
  const abrirEliminar = (grupo: GrupoResumen) => {
    setGrupoActual(grupo);
    setShowEliminar(true);
  };

  const handleEliminar = async () => {
    if (!grupoActual) return;
    setSaving(true);
    const res = await eliminarGrupo(grupoActual.id);
    setSaving(false);
    if (res.success) {
      setShowEliminar(false);
      setGrupoActual(null);
      cargarGrupos();
    } else {
      setError(res.error || "Error al eliminar grupo");
    }
  };

  // ── Detalle (gestionar miembros) ────────────────────────────────────────
  const abrirDetalle = async (grupo: GrupoResumen) => {
    setGrupoActual(grupo);
    setShowDetalle(true);
    setBusqueda("");
    setResultados([]);
    const res = await obtenerGrupo(grupo.id);
    if (res.success) {
      setGrupoDetalle(res.data);
    }
  };

  const recargarDetalle = async () => {
    if (!grupoActual) return;
    const res = await obtenerGrupo(grupoActual.id);
    if (res.success) {
      setGrupoDetalle(res.data);
    }
  };

  // ── Buscar usuarios ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!showDetalle || !grupoActual || busqueda.length < 2) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      const res = await buscarUsuarios(grupoActual.id, busqueda);
      if (res.success) {
        setResultados(res.data);
      }
      setBuscando(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda, showDetalle, grupoActual]);

  // ── Agregar miembro ─────────────────────────────────────────────────────
  const handleAgregarMiembro = async (usuarioId: number) => {
    if (!grupoActual) return;
    const res = await agregarMiembro(grupoActual.id, usuarioId);
    if (res.success) {
      setBusqueda("");
      setResultados([]);
      recargarDetalle();
      cargarGrupos();
    } else {
      setError(res.error || "Error al agregar miembro");
    }
  };

  // ── Quitar miembro ──────────────────────────────────────────────────────
  const handleQuitarMiembro = async (miembroId: number) => {
    if (!grupoActual) return;
    const res = await quitarMiembro(grupoActual.id, miembroId);
    if (res.success) {
      recargarDetalle();
      cargarGrupos();
    } else {
      setError(res.error || "Error al quitar miembro");
    }
  };

  // ── Cerrar error ────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <IonPage>
      <IonContent className="grupos-bg" scrollY={true} forceOverscroll={false}>
        <div className="grupos-phone">
          {/* Back */}
          <div className="grupos-back-section">
            <p className="grupos-back" onClick={onVolver}>
              ← Perfil
            </p>
          </div>

          {/* Hero */}
          <div className="grupos-hero">
            <div className="grupos-hero-top">
              <div>
                <h2>Grupos de Confianza</h2>
                <p>Gestión y asignación de usuarios</p>
              </div>
              <div className="grupos-status-badge">
                <span className="grupos-status-dot"></span>
                Activo
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="grupos-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Crear btn */}
          <button
            className="grupos-crear-btn"
            onClick={() => {
              setFormNombre("");
              setFormDescripcion("");
              setShowCrear(true);
            }}
          >
            <span>＋</span> Nuevo grupo
          </button>

          {/* Loading */}
          {loading && (
            <div className="grupos-loading">
              <div className="grupos-spinner" />
              <p>Cargando grupos...</p>
            </div>
          )}

          {/* Lista de grupos */}
          {!loading && (
            <div className="grupos-lista">
              {grupos.length === 0 ? (
                <div className="grupos-empty">
                  <div className="grupos-empty-icon">🤝</div>
                  <p>Sin grupos aún</p>
                  <p>Crea tu primer grupo de confianza</p>
                </div>
              ) : (
                grupos.map((grupo) => (
                  <div key={grupo.id} className="grupo-card">
                    <div className="grupo-card-header">
                      <div className="grupo-card-info">
                        <h3>{grupo.nombre}</h3>
                        <p className="grupo-card-meta">
                          {grupo.cantidadMiembros} miembro
                          {grupo.cantidadMiembros !== 1 ? "s" : ""}
                          {grupo.descripcion && ` · ${grupo.descripcion}`}
                        </p>
                      </div>
                      <div className="grupo-card-actions">
                        <button
                          className="grupo-action-btn edit"
                          onClick={() => abrirEditar(grupo)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="grupo-action-btn delete"
                          onClick={() => abrirEliminar(grupo)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Miembros preview chips */}
                    <div
                      className="grupo-miembros"
                      onClick={() => abrirDetalle(grupo)}
                      style={{ cursor: "pointer" }}
                    >
                      {grupo.miembrosPreview.map((m) => (
                        <span key={m.id} className="miembro-chip">
                          <span className="miembro-chip-avatar">
                            {m.nombre.charAt(0).toUpperCase()}
                          </span>
                          {m.nombre.split(" ")[0]}
                        </span>
                      ))}
                      {grupo.cantidadMiembros > 3 && (
                        <span className="miembro-chip more">
                          +{grupo.cantidadMiembros - 3} más
                        </span>
                      )}
                      {grupo.cantidadMiembros === 0 && (
                        <span className="miembro-chip more">
                          Agregar miembros
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Crear Grupo */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showCrear && (
          <div
            className="grupos-modal-overlay"
            onClick={() => setShowCrear(false)}
          >
            <div
              className="grupos-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grupos-modal-header">
                <h3>Nuevo Grupo</h3>
                <button
                  className="grupos-modal-close"
                  onClick={() => setShowCrear(false)}
                >
                  ×
                </button>
              </div>
              <div className="grupos-modal-body">
                <div className="grupos-field">
                  <label>Nombre del grupo</label>
                  <input
                    type="text"
                    placeholder="Ej: Grupo FISI"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <div className="grupos-field">
                  <label>Descripción (opcional)</label>
                  <textarea
                    placeholder="Ej: Zona A"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    maxLength={250}
                  />
                </div>
              </div>
              <div className="grupos-modal-footer">
                <button
                  className="grupos-btn-secondary"
                  onClick={() => setShowCrear(false)}
                >
                  Cancelar
                </button>
                <button
                  className="grupos-btn-primary"
                  onClick={handleCrear}
                  disabled={!formNombre.trim() || saving}
                >
                  {saving ? "Creando..." : "Crear grupo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Editar Grupo */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showEditar && grupoActual && (
          <div
            className="grupos-modal-overlay"
            onClick={() => setShowEditar(false)}
          >
            <div
              className="grupos-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grupos-modal-header">
                <h3>Editar Grupo</h3>
                <button
                  className="grupos-modal-close"
                  onClick={() => setShowEditar(false)}
                >
                  ×
                </button>
              </div>
              <div className="grupos-modal-body">
                <div className="grupos-field">
                  <label>Nombre del grupo</label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <div className="grupos-field">
                  <label>Descripción (opcional)</label>
                  <textarea
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    maxLength={250}
                  />
                </div>
              </div>
              <div className="grupos-modal-footer">
                <button
                  className="grupos-btn-secondary"
                  onClick={() => setShowEditar(false)}
                >
                  Cancelar
                </button>
                <button
                  className="grupos-btn-primary"
                  onClick={handleEditar}
                  disabled={!formNombre.trim() || saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Confirmar Eliminar */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showEliminar && grupoActual && (
          <div
            className="grupos-modal-overlay"
            onClick={() => setShowEliminar(false)}
          >
            <div
              className="grupos-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grupos-modal-header">
                <h3>Eliminar Grupo</h3>
                <button
                  className="grupos-modal-close"
                  onClick={() => setShowEliminar(false)}
                >
                  ×
                </button>
              </div>
              <div className="grupos-modal-body">
                <div className="grupos-confirm-icon">⚠️</div>
                <p className="grupos-confirm-text">
                  ¿Estás seguro de eliminar el grupo{" "}
                  <strong>{grupoActual.nombre}</strong>? Esta acción no se
                  puede deshacer.
                </p>
              </div>
              <div className="grupos-modal-footer">
                <button
                  className="grupos-btn-secondary"
                  onClick={() => setShowEliminar(false)}
                >
                  Cancelar
                </button>
                <button
                  className="grupos-btn-danger"
                  onClick={handleEliminar}
                  disabled={saving}
                >
                  {saving ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MODAL: Detalle / Gestionar Miembros */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {showDetalle && grupoActual && (
          <div
            className="grupos-modal-overlay"
            onClick={() => setShowDetalle(false)}
          >
            <div
              className="grupos-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grupos-modal-header">
                <h3>{grupoActual.nombre}</h3>
                <button
                  className="grupos-modal-close"
                  onClick={() => setShowDetalle(false)}
                >
                  ×
                </button>
              </div>
              <div className="grupos-modal-body">
                {/* Buscar y agregar */}
                <div className="grupos-detail-section">
                  <h4>Agregar miembros</h4>
                  <div className="grupos-search-container">
                    <span className="grupos-search-icon">🔍</span>
                    <input
                      className="grupos-search-input"
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>

                  {buscando && (
                    <p
                      style={{
                        color: "var(--app-text-muted)",
                        fontSize: "12px",
                        textAlign: "center",
                        margin: "8px 0",
                      }}
                    >
                      Buscando...
                    </p>
                  )}

                  {resultados.length > 0 && (
                    <div className="grupos-search-results">
                      {resultados.map((u) => (
                        <div key={u.id} className="grupos-search-item">
                          <div className="grupos-search-item-info">
                            <div className="grupos-search-avatar">
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="grupos-search-details">
                              <div className="grupos-search-name">
                                {u.nombre}
                              </div>
                              <div className="grupos-search-role">{u.rol}</div>
                            </div>
                          </div>
                          <button
                            className="grupos-add-btn"
                            onClick={() => handleAgregarMiembro(u.id)}
                            title="Agregar"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {busqueda.length >= 2 &&
                    !buscando &&
                    resultados.length === 0 && (
                      <p
                        style={{
                          color: "var(--app-text-muted)",
                          fontSize: "12px",
                          textAlign: "center",
                          margin: "8px 0",
                        }}
                      >
                        No se encontraron usuarios
                      </p>
                    )}
                </div>

                {/* Lista de miembros actuales */}
                <div className="grupos-detail-section">
                  <h4>
                    Miembros ({grupoDetalle?.cantidadMiembros ?? 0})
                  </h4>
                  {grupoDetalle && grupoDetalle.miembros.length > 0 ? (
                    <div className="grupos-miembros-list">
                      {grupoDetalle.miembros.map((m) => (
                        <div key={m.id} className="grupos-miembro-row">
                          <div className="grupos-miembro-info">
                            <div className="grupos-miembro-avatar">
                              {m.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="grupos-miembro-details">
                              <div className="grupos-miembro-name">
                                {m.nombre}
                              </div>
                              <div className="grupos-miembro-role">{m.rol}</div>
                            </div>
                          </div>
                          <button
                            className="grupos-remove-btn"
                            onClick={() => handleQuitarMiembro(m.usuarioId)}
                            title="Quitar"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="grupos-no-miembros">
                      Aún no hay miembros. Busca usuarios arriba para agregar.
                    </p>
                  )}
                </div>
              </div>
              <div className="grupos-modal-footer">
                <button
                  className="grupos-btn-primary"
                  onClick={() => setShowDetalle(false)}
                  style={{ flex: "none", padding: "13px 28px" }}
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default GruposConfianzaScreen;
