import { IonContent, IonPage } from "@ionic/react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { wsService } from "../services/wsService";
import { getZonas } from "../services/alertasService";
import "./GuardiaInfoScreen.css";

type Props = {
  onVerAlertas: () => void;
  onCerrarSesion: () => void;
};

type TokenData = {
  nombre?: string;
  email?: string;
  correo?: string;
  role?: string;
  rol?: string;
  zona?: string;
  sub?: string;
};

// ── Categorías de actividades ──────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: "control_acceso",
    nombre: "Control de acceso",
    emoji: "🔐",
    color: "#3b82f6",
    subtipos: [
      "Verificar identificaciones de estudiantes/docentes/visitantes",
      "Registrar entradas y salidas del personal",
      "Autorizar ingreso de vehículos y asignar estacionamiento",
      "Controlar acceso a zonas restringidas",
    ],
  },
  {
    id: "vigilancia_rondas",
    nombre: "Vigilancia y rondas",
    emoji: "👁️",
    color: "#8b5cf6",
    subtipos: [
      "Recorrido periódico por instalaciones",
      "Monitoreo de cámaras de seguridad (CCTV)",
      "Verificar puertas y ventanas aseguradas",
      "Vigilar áreas con equipos de valor",
    ],
  },
  {
    id: "atencion_incidentes",
    nombre: "Atención a incidentes",
    emoji: "🚨",
    color: "#ef4444",
    subtipos: [
      "Responder a emergencias (peleas, accidentes, robos)",
      "Coordinar con Policía Nacional o servicios de emergencia",
      "Prestar primeros auxilios básicos",
      "Controlar y reportar situaciones de conflicto",
    ],
  },
  {
    id: "prevencion",
    nombre: "Prevención",
    emoji: "🛡️",
    color: "#f59e0b",
    subtipos: [
      "Detectar comportamientos sospechosos",
      "Evitar ingreso de personas no autorizadas o bajo efectos de sustancias",
      "Controlar que no ingresen armas u objetos peligrosos",
      "Prevenir hurto de equipos o bienes",
    ],
  },
  {
    id: "apoyo_logistico",
    nombre: "Apoyo logístico",
    emoji: "📋",
    color: "#10b981",
    subtipos: [
      "Registrar novedades en libro de control de turno",
      "Recibir y entregar llaves de aulas o instalaciones",
      "Orientar a visitantes sobre ubicación de oficinas",
      "Apoyar en eventos académicos (foros, graduaciones, deportivos)",
    ],
  },
  {
    id: "gestion_vehiculos",
    nombre: "Gestión de vehículos",
    emoji: "🚗",
    color: "#06b6d4",
    subtipos: [
      "Controlar salida de equipos o bienes con autorización",
      "Registrar placas de vehículos que ingresan",
      "Reportar vehículos sospechosos o mal estacionados",
    ],
  },
  {
    id: "comunicacion",
    nombre: "Comunicación",
    emoji: "📡",
    color: "#ec4899",
    subtipos: [
      "Mantener comunicación con central de seguridad",
      "Reportar novedades al jefe de seguridad o rectorado",
      "Coordinar con otros guardias el relevo de turnos",
    ],
  },
  {
    id: "personalizada",
    nombre: "Actividad personalizada",
    emoji: "✍️",
    color: "#64748b",
    subtipos: [],
  },
];

interface ActividadData {
  categoriaId: string;
  subtipo: string;
  zona: string;
  observaciones: string;
  horaInicio: string;
  horaFin: string;
}

interface ActividadGuardada extends ActividadData {
  guardia: string;
  fecha: string;
  fechaISO: string;
}

const getHoraActual = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const GuardiaInfoScreen: React.FC<Props> = ({ onVerAlertas, onCerrarSesion }) => {
  const [user, setUser] = useState<TokenData | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [paso, setPaso] = useState<1 | 2>(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<(typeof CATEGORIAS)[0] | null>(null);
  const [actividadData, setActividadData] = useState<ActividadData>({
    categoriaId: "",
    subtipo: "",
    zona: "",
    observaciones: "",
    horaInicio: "",
    horaFin: "",
  });

  const [actividadEnCurso, setActividadEnCurso] = useState<ActividadData | null>(null);
  const [showModalTerminar, setShowModalTerminar] = useState(false);
  const [observacionesTerminar, setObservacionesTerminar] = useState("");

  const [misActividades, setMisActividades] = useState<ActividadGuardada[]>([]);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [filtroHoraInicio, setFiltroHoraInicio] = useState("");
  const [filtroHoraFin, setFiltroHoraFin] = useState("");
  const [showActividades, setShowActividades] = useState(false);
  const [zonasDisponibles, setZonasDisponibles] = useState<string[]>([]);

  useEffect(() => {
    // Restaurar actividades guardadas en localStorage
    try {
      const saved = localStorage.getItem("mis_actividades_guardia");
      if (saved) {
        const parsed = JSON.parse(saved) as ActividadGuardada[];
        if (Array.isArray(parsed)) {
          setMisActividades(parsed);
        }
      }
      
      const enCurso = localStorage.getItem("actividad_en_curso");
      if (enCurso) {
        setActividadEnCurso(JSON.parse(enCurso));
      }
    } catch {
      // Si el JSON es inválido, limpiar
      localStorage.removeItem("mis_actividades_guardia");
      localStorage.removeItem("actividad_en_curso");
    }
    // Cargar zonas dinámicamente desde la API
    getZonas()
      .then((data: any) => {
        const lista: any[] = Array.isArray(data) ? data : (data?.zonas || []);
        const nombres = lista.map((z: any) => z.nombre || z.name || String(z)).filter(Boolean);
        setZonasDisponibles(nombres);
      })
      .catch(() => {});

    const handleNuevaActividadWS = (e: any) => {
      const data = e.detail as ActividadGuardada;
      setMisActividades((prev) => {
        const yaExiste = prev.some(
          (a) => a.fechaISO === data.fechaISO && a.categoriaId === data.categoriaId && a.subtipo === data.subtipo
        );
        if (yaExiste) return prev;
        const updated = [data, ...prev];
        localStorage.setItem("mis_actividades_guardia", JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener("app-nueva-actividad", handleNuevaActividadWS);
    return () => window.removeEventListener("app-nueva-actividad", handleNuevaActividadWS);
  }, []);

  useEffect(() => {
    const cargarToken = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode<TokenData>(token);
          setUser(decoded);
          wsService.connect();
        }
      } catch (err) {
        console.error("Error leyendo token:", err);
      }
    };
    cargarToken();
  }, []);

  const handleToggle = async () => {
    const nuevoEstado = !disponible;
    setGuardando(true);
    try {
      await wsService.connect();
      wsService.send({ tipo: "disponibilidad", disponible: nuevoEstado });
      setDisponible(nuevoEstado);
    } catch (err) {
      console.error("Error actualizando disponibilidad:", err);
    } finally {
      setGuardando(false);
    }
  };

  const obtenerIniciales = () => {
    if (!user?.nombre) return "GU";
    return user.nombre
      .split(" ")
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join("");
  };

  const abrirModal = () => {
    setPaso(1);
    setCategoriaSeleccionada(null);
    setActividadData({ categoriaId: "", subtipo: "", zona: user?.zona || "", observaciones: "", horaInicio: getHoraActual(), horaFin: "" });
    setShowModal(true);
  };

  const elegirCategoria = (cat: (typeof CATEGORIAS)[0]) => {
    setCategoriaSeleccionada(cat);
    setActividadData((prev) => ({ ...prev, categoriaId: cat.id, subtipo: "", zona: prev.zona || user?.zona || "" }));
    setPaso(2);
  };

  const iniciarActividad = () => {
    if (!categoriaSeleccionada) return;
    if (!actividadData.subtipo || !actividadData.horaInicio) {
      alert("Por favor completa el tipo de actividad y la hora de inicio.");
      return;
    }
    if (!actividadData.zona) {
      alert("Por favor indica la zona donde se realizará la actividad.");
      return;
    }

    const nuevaEnCurso: ActividadData = {
      ...actividadData,
      horaFin: ""
    };

    setActividadEnCurso(nuevaEnCurso);
    localStorage.setItem("actividad_en_curso", JSON.stringify(nuevaEnCurso));
    setShowModal(false);
  };

  const terminarActividad = () => {
    if (!actividadEnCurso) return;

    const cat = getCategoriaById(actividadEnCurso.categoriaId);

    const nueva: ActividadGuardada = {
      ...actividadEnCurso,
      observaciones: observacionesTerminar,
      horaFin: getHoraActual(),
      guardia: user?.nombre || "Guardia",
      fecha: new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }),
      fechaISO: new Date().toISOString(),
    };

    // Guardar en localStorage
    const actualizadas = [nueva, ...misActividades];
    setMisActividades(actualizadas);
    localStorage.setItem("mis_actividades_guardia", JSON.stringify(actualizadas));

    // Limpiar en curso
    setActividadEnCurso(null);
    localStorage.removeItem("actividad_en_curso");
    setObservacionesTerminar("");
    setShowModalTerminar(false);

    // Enviar por WebSocket
    wsService.send({
      tipo: "nueva_actividad",
      guardia: nueva.guardia,
      categoriaId: nueva.categoriaId,
      categoriaNombre: cat?.nombre || "Actividad",
      subtipo: nueva.subtipo,
      zona: nueva.zona,
      observaciones: nueva.observaciones,
      horaInicio: nueva.horaInicio,
      horaFin: nueva.horaFin,
      fecha: nueva.fecha,
      fechaISO: nueva.fechaISO,
    });

    alert("✅ Actividad finalizada y registrada correctamente.");
  };

  const getCategoriaById = (id: string) => CATEGORIAS.find((c) => c.id === id);

  return (
    <IonPage>
      <IonContent className="gi-bg">
        <div className="gi-container">

          {/* HEADER AZUL */}
          <div className="gi-top-card">
            <div className="gi-top-bar">
              <button className="gi-back-btn" onClick={onCerrarSesion}>← Inicio</button>
              <span className="gi-menu">•••</span>
            </div>

            <h2 className="gi-title">Mi perfil</h2>

            <div className="gi-avatar">{obtenerIniciales()}</div>
            <h3 className="gi-name">{user?.nombre || "Guardia"}</h3>
            <p className="gi-email">{user?.email || user?.correo || "correo@uta.edu.ec"}</p>
            <div className="gi-role-badge">Guardia de seguridad</div>
          </div>

          {/* CARD DATOS */}
          <div className="gi-info-card">
            <p className="gi-section-title">DATOS PERSONALES</p>
            <div className="gi-row">
              <span>Nombre completo</span>
              <strong>{user?.nombre || "Guardia"}</strong>
            </div>
            <div className="gi-row">
              <span>Correo institucional</span>
              <strong>{user?.email || user?.correo || "correo@uta.edu.ec"}</strong>
            </div>
            <div className="gi-row">
              <span>Rol</span>
              <strong>Guardia</strong>
            </div>
            <div className="gi-row">
              <span>Estado</span>
              <strong style={{ color: disponible ? "#10b981" : "#ef4444" }}>
                {disponible ? "Activo" : "Inactivo"}
              </strong>
            </div>
            <div className="gi-row">
              <span>Zona de cobertura</span>
              <strong>{user?.zona || "Zona no asignada"}</strong>
            </div>
          </div>

          {/* CARD SESIÓN */}
          <div className="gi-info-card">
            <p className="gi-section-title">SESIÓN</p>
            <div className="gi-row">
              <span>Último acceso</span>
              <strong>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
            </div>
            <div className="gi-row">
              <span>Token expira en</span>
              <strong>24 h</strong>
            </div>
          </div>

          {/* DISPONIBILIDAD */}
          <div className="gi-disponibilidad-card">
            <div>
              <p className="gi-disp-title">Disponibilidad</p>
              <p className="gi-disp-sub">{disponible ? "Recibiendo alertas" : "Sin recibir alertas"}</p>
            </div>
            <button
              className={`gi-toggle ${disponible ? "toggle-on" : "toggle-off"}`}
              onClick={handleToggle}
              disabled={guardando}
            >
              <span className="gi-toggle-thumb" />
            </button>
          </div>

          {/* BOTÓN REGISTRAR O ACTIVIDAD EN CURSO */}
          {!actividadEnCurso ? (
            <button className="gi-actividad-btn" onClick={abrirModal}>
              📋 Registrar nueva actividad
            </button>
          ) : (
            <div className="gi-info-card" style={{ borderColor: "#3b82f6", borderWidth: 2, borderStyle: "solid" }}>
              <p className="gi-section-title" style={{ color: "#3b82f6" }}>ACTIVIDAD EN CURSO</p>
              <div style={{ marginBottom: "15px", fontSize: "0.95rem" }}>
                <strong>{getCategoriaById(actividadEnCurso.categoriaId)?.nombre}</strong>
                <div style={{ color: "var(--app-text-secondary)", marginTop: "4px" }}>{actividadEnCurso.subtipo}</div>
                <div style={{ marginTop: "6px" }}>📍 {actividadEnCurso.zona}</div>
                <div style={{ marginTop: "4px" }}>🕐 Iniciada a las: {actividadEnCurso.horaInicio}</div>
              </div>
              <button 
                className="gi-actividad-btn" 
                style={{ backgroundColor: "#ef4444", marginTop: 0 }}
                onClick={() => setShowModalTerminar(true)}
              >
                ⏹️ Terminar actividad
              </button>
            </div>
          )}

          {/* BOTÓN ALERTAS */}
          <button className="gi-alertas-btn" onClick={onVerAlertas}>
            🚨 Ver alertas activas
          </button>

          {/* MIS ACTIVIDADES toggle */}
          <button
            className="gi-mis-actividades-btn"
            onClick={() => setShowActividades((v) => !v)}
          >
            {showActividades ? "▲ Ocultar actividades" : "📅 Mis actividades"}
          </button>

          {/* LOGOUT */}
          <button
            className="gi-logout-btn"
            onClick={onCerrarSesion}
          >
            Cerrar sesión
          </button>

          {/* HISTORIAL DE ACTIVIDADES */}
          {showActividades && <div className="gi-info-card" style={{ marginTop: "20px" }}>
            <p className="gi-section-title">MIS ACTIVIDADES REGISTRADAS</p>

            {/* Filtros de fecha */}
            <div className="gi-filtro-fechas">
              <div className="gi-filtro-campo">
                <label>Desde</label>
                <input
                  type="date"
                  className="gi-modal-input gi-filtro-input"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                />
              </div>
              <div className="gi-filtro-campo">
                <label>Hasta</label>
                <input
                  type="date"
                  className="gi-modal-input gi-filtro-input"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                />
              </div>
            </div>
            <div className="gi-filtro-fechas" style={{ marginTop: "8px" }}>
              <div className="gi-filtro-campo">
                <label>Hora inicio</label>
                <input
                  type="time"
                  className="gi-modal-input gi-filtro-input"
                  value={filtroHoraInicio}
                  onChange={(e) => setFiltroHoraInicio(e.target.value)}
                />
              </div>
              <div className="gi-filtro-campo">
                <label>Hora fin</label>
                <input
                  type="time"
                  className="gi-modal-input gi-filtro-input"
                  value={filtroHoraFin}
                  onChange={(e) => setFiltroHoraFin(e.target.value)}
                />
              </div>
              {(filtroFechaInicio || filtroFechaFin || filtroHoraInicio || filtroHoraFin) && (
                <button
                  className="gi-filtro-clear"
                  onClick={() => { setFiltroFechaInicio(""); setFiltroFechaFin(""); setFiltroHoraInicio(""); setFiltroHoraFin(""); }}
                  title="Limpiar filtros"
                >
                  ✕
                </button>
              )}
            </div>

            {(() => {
              const actividadesFiltradas = misActividades.filter((act) => {
                // Filtro por fecha
                if (filtroFechaInicio || filtroFechaFin) {
                  if (!act.fechaISO) return true;
                  const fechaAct = new Date(act.fechaISO);
                  fechaAct.setHours(0, 0, 0, 0);
                  if (filtroFechaInicio) {
                    const inicio = new Date(filtroFechaInicio + "T00:00:00");
                    if (fechaAct < inicio) return false;
                  }
                  if (filtroFechaFin) {
                    const fin = new Date(filtroFechaFin + "T23:59:59");
                    if (fechaAct > fin) return false;
                  }
                }
                // Filtro por hora
                const horaIni = String(act.horaInicio || "").trim();
                const horaFn = String(act.horaFin || "").trim();
                if (filtroHoraInicio && horaIni && horaIni < filtroHoraInicio) return false;
                if (filtroHoraFin && horaFn && horaFn > filtroHoraFin) return false;
                return true;
              });

              if (actividadesFiltradas.length === 0) {
                return (
                  <p style={{ color: "var(--app-text-secondary)", fontSize: "0.9rem", textAlign: "center", padding: "10px 0" }}>
                    {misActividades.length === 0
                      ? "No tienes actividades registradas."
                      : "Sin actividades en ese rango de fechas/horas."}
                  </p>
                );
              }

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {actividadesFiltradas.map((act, i) => {
                    const cat = getCategoriaById(act.categoriaId);
                    return (
                      <div key={i} className="gi-actividad-card" style={{ borderLeft: `4px solid ${cat?.color || "#6b7280"}` }}>
                        <div className="gi-actividad-header">
                          <span className="gi-actividad-cat">
                            {cat?.emoji} {cat?.nombre || act.categoriaId}
                          </span>
                          <span className="gi-actividad-fecha">{act.fecha}</span>
                        </div>
                        <div className="gi-actividad-subtipo">{act.subtipo}</div>
                        {act.zona && (
                          <div className="gi-actividad-zona">📍 {act.zona}</div>
                        )}
                        {act.observaciones && (
                          <div className="gi-actividad-obs">💬 {act.observaciones}</div>
                        )}
                        <div className="gi-actividad-horario">
                          🕐 {act.horaInicio} → {act.horaFin}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>}

        </div>

        {/* ── MODAL REGISTRAR ACTIVIDAD ── */}
        {showModal && (
          <div className="gi-modal-overlay">
            <div className="gi-modal-content gi-modal-actividad">

              {/* Header del modal */}
              <div className="gi-modal-header">
                {paso === 2 && (
                  <button className="gi-modal-back" onClick={() => setPaso(1)}>← Volver</button>
                )}
                <h3 className="gi-modal-title">
                  {paso === 1 ? "📋 Registrar actividad" : `${categoriaSeleccionada?.emoji} ${categoriaSeleccionada?.nombre}`}
                </h3>
                <button className="gi-modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {/* PASO 1 — Elegir categoría */}
              {paso === 1 && (
                <div className="gi-categorias-grid">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat.id}
                      className="gi-categoria-card"
                      style={{ borderColor: cat.color }}
                      onClick={() => elegirCategoria(cat)}
                    >
                      <span className="gi-cat-emoji">{cat.emoji}</span>
                      <span className="gi-cat-nombre">{cat.nombre}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* PASO 2 — Detalles de la actividad */}
              {paso === 2 && categoriaSeleccionada && (
                <div className="gi-modal-form">

                  <div className="gi-modal-group">
                    <label>Tipo de actividad *</label>
                    <input
                      list={`subtipos-${categoriaSeleccionada.id}`}
                      className="gi-modal-input"
                      placeholder="Escribe o selecciona un tipo..."
                      value={actividadData.subtipo}
                      onChange={(e) => setActividadData({ ...actividadData, subtipo: e.target.value })}
                    />
                    <datalist id={`subtipos-${categoriaSeleccionada.id}`}>
                      {categoriaSeleccionada.subtipos.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  <div className="gi-modal-group">
                    <label>Zona *</label>
                    <select
                      className="gi-modal-input"
                      value={actividadData.zona}
                      onChange={(e) => setActividadData({ ...actividadData, zona: e.target.value })}
                    >
                      <option value="" disabled>
                        {zonasDisponibles.length > 0 ? "Selecciona una zona..." : "Cargando zonas..."}
                      </option>
                      {zonasDisponibles.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="gi-modal-group">
                    <label>Hora inicio *</label>
                    <input
                      type="time"
                      className="gi-modal-input"
                      value={actividadData.horaInicio}
                      onChange={(e) => setActividadData({ ...actividadData, horaInicio: e.target.value })}
                    />
                  </div>

                  <div className="gi-modal-actions">
                    <button className="gi-modal-btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button
                      className="gi-modal-btn-save"
                      onClick={iniciarActividad}
                    >
                      Iniciar actividad
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL TERMINAR ACTIVIDAD ── */}
        {showModalTerminar && (
          <div className="gi-modal-overlay">
            <div className="gi-modal-content gi-modal-actividad">
              <div className="gi-modal-header">
                <h3 className="gi-modal-title">⏹️ Terminar actividad</h3>
                <button className="gi-modal-close" onClick={() => setShowModalTerminar(false)}>✕</button>
              </div>
              <div className="gi-modal-form">
                <div className="gi-modal-group">
                  <label>Novedades / Observaciones</label>
                  <textarea
                    className="gi-modal-input gi-modal-textarea"
                    placeholder="Escribe las novedades ocurridas durante la actividad..."
                    value={observacionesTerminar}
                    onChange={(e) => setObservacionesTerminar(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="gi-modal-actions">
                  <button className="gi-modal-btn-cancel" onClick={() => setShowModalTerminar(false)}>
                    Cancelar
                  </button>
                  <button
                    className="gi-modal-btn-save"
                    onClick={terminarActividad}
                  >
                    Finalizar y guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default GuardiaInfoScreen;