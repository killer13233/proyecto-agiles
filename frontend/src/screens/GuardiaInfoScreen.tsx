import { IonContent, IonPage } from "@ionic/react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { wsService } from "../services/wsService";
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

const GuardiaInfoScreen: React.FC<Props> = ({
  onVerAlertas,
  onCerrarSesion,
}) => {
  const [user, setUser] = useState<TokenData | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal de Rondas
  const [showRondaModal, setShowRondaModal] = useState(false);
  const [rondaData, setRondaData] = useState({ zona: "", inicio: "", fin: "" });
  const [misRondas, setMisRondas] = useState<any[]>([]);

  useEffect(() => {
    // Cargar rondas del guardia
    const saved = JSON.parse(localStorage.getItem('mis_rondas_guardia') || '[]');
    setMisRondas(saved);

    // Escuchar rondas recibidas por WS (de otros guardias o eco propio)
    const handleNuevaRondaWS = (e: any) => {
      const data = e.detail;
      const nuevaRonda = {
        zona: data.zona,
        inicio: data.inicio,
        fin: data.fin,
        guardia: data.guardia,
        fecha: new Date().toLocaleDateString()
      };
      setMisRondas(prev => {
        // Evitar duplicados (si yo mismo la envié ya está)
        const yaExiste = prev.some(
          r => r.zona === nuevaRonda.zona && r.inicio === nuevaRonda.inicio && r.fin === nuevaRonda.fin && r.fecha === nuevaRonda.fecha
        );
        if (yaExiste) return prev;
        const updated = [nuevaRonda, ...prev];
        localStorage.setItem('mis_rondas_guardia', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('app-nueva-ronda', handleNuevaRondaWS);
    return () => {
      window.removeEventListener('app-nueva-ronda', handleNuevaRondaWS);
    };
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

      wsService.send({
        tipo: "disponibilidad",
        disponible: nuevoEstado,
      });

      setDisponible(nuevoEstado);
    } catch (err) {
      console.error("Error actualizando disponibilidad:", err);
    } finally {
      setGuardando(false);
    }
  };

  // Iniciales del nombre
  const obtenerIniciales = () => {
    if (!user?.nombre) return "GU";

    return user.nombre
      .split(" ")
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join("");
  };

  // Obtener hora actual en formato HH:MM
  const getHoraActual = (): string => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <IonPage>
      <IonContent className="gi-bg">

        <div className="gi-container">

          {/* HEADER AZUL */}
          <div className="gi-top-card">

            <div className="gi-top-bar">
              <button
                className="gi-back-btn"
                onClick={onCerrarSesion}
              >
                ← Inicio
              </button>

              <span className="gi-menu">
                •••
              </span>
            </div>

            <h2 className="gi-title">
              Mi perfil
            </h2>

            {/* Avatar */}
            <div className="gi-avatar">
              {obtenerIniciales()}
            </div>

            {/* Nombre */}
            <h3 className="gi-name">
              {user?.nombre || "Guardia"}
            </h3>

            {/* Correo */}
            <p className="gi-email">
              {user?.email || user?.correo || "correo@uta.edu.ec"}
            </p>

            {/* Badge */}
            <div className="gi-role-badge">
              Guardia de seguridad
            </div>

          </div>

          {/* CARD DATOS */}
          <div className="gi-info-card">

            <p className="gi-section-title">
              DATOS PERSONALES
            </p>

            <div className="gi-row">
              <span>Nombre completo</span>
              <strong>{user?.nombre || "Guardia"}</strong>
            </div>

            <div className="gi-row">
              <span>Correo institucional</span>
              <strong>
                {user?.email || user?.correo || "correo@uta.edu.ec"}
              </strong>
            </div>

            <div className="gi-row">
              <span>Rol</span>
              <strong>Guardia</strong>
            </div>

            <div className="gi-row">
              <span>Estado</span>

              <strong
                style={{
                  color: disponible ? "#10b981" : "#ef4444",
                }}
              >
                {disponible ? "Activo" : "Inactivo"}
              </strong>
            </div>

            <div className="gi-row">
              <span>Zona de cobertura</span>

              <strong>
                {user?.zona || "Zona no asignada"}
              </strong>
            </div>

          </div>

          {/* CARD SESIÓN */}
          <div className="gi-info-card">

            <p className="gi-section-title">
              SESIÓN
            </p>

            <div className="gi-row">
              <span>Último acceso</span>
              <strong>
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>

            <div className="gi-row">
              <span>Token expira en</span>
              <strong>24 h</strong>
            </div>

          </div>

          {/* DISPONIBILIDAD */}
          <div className="gi-disponibilidad-card">

            <div>
              <p className="gi-disp-title">
                Disponibilidad
              </p>

              <p className="gi-disp-sub">
                {disponible
                  ? "Recibiendo alertas"
                  : "Sin recibir alertas"}
              </p>
            </div>

            <button
              className={`gi-toggle ${
                disponible
                  ? "toggle-on"
                  : "toggle-off"
              }`}
              onClick={handleToggle}
              disabled={guardando}
            >
              <span className="gi-toggle-thumb" />
            </button>

          </div>

          {/* BOTÓN REGISTRAR RONDA */}
          <button
            className="gi-ronda-btn"
            onClick={() => {
              setRondaData({ zona: user?.zona || "", inicio: getHoraActual(), fin: "" });
              setShowRondaModal(true);
            }}
          >
            📍 Registrar nueva ronda
          </button>

          {/* BOTÓN ALERTAS */}
          <button
            className="gi-alertas-btn"
            onClick={onVerAlertas}
          >
            🚨 Ver alertas activas
          </button>

          {/* LOGOUT */}
          <button
            className="gi-logout-btn"
            onClick={onCerrarSesion}
          >
            Cerrar sesión
          </button>

          {/* HISTORIAL DE RONDAS DEL GUARDIA */}
          <div className="gi-info-card" style={{ marginTop: '20px' }}>
            <p className="gi-section-title">MIS RONDAS REGISTRADAS</p>
            {misRondas.length === 0 ? (
              <p style={{ color: 'var(--app-text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>
                No tienes rondas registradas.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {misRondas.map((r, i) => (
                  <div key={i} style={{ 
                    background: 'var(--app-card-bg)', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '1px solid var(--app-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--app-primary)' }}>{r.zona}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--app-text-secondary)' }}>{r.fecha}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--app-text)' }}>
                      <span>Inicio: {r.inicio}</span> | <span>Fin: {r.fin}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* MODAL DE RONDAS */}
        {showRondaModal && (
          <div className="gi-modal-overlay">
            <div className="gi-modal-content">
              <h3 className="gi-modal-title">Registrar Ronda</h3>
              
              <div className="gi-modal-group">
                <label>Zona</label>
                <select 
                  value={rondaData.zona}
                  onChange={(e) => setRondaData({...rondaData, zona: e.target.value})}
                  className="gi-modal-input"
                >
                  <option value="">Selecciona tu zona</option>
                  <option value="Zona A">Zona A</option>
                  <option value="Zona B">Zona B</option>
                  <option value="Zona C">Zona C</option>
                  <option value="Zona D">Zona D</option>
                </select>
              </div>

              <div className="gi-modal-group">
                <label>Hora Inicio</label>
                <input 
                  type="time"
                  value={rondaData.inicio}
                  min={getHoraActual()}
                  onChange={(e) => {
                    const horaActual = getHoraActual();
                    if (e.target.value < horaActual) {
                      alert("La hora de inicio no puede ser anterior a la hora actual (" + horaActual + ").");
                      setRondaData({...rondaData, inicio: horaActual});
                      return;
                    }
                    setRondaData({...rondaData, inicio: e.target.value});
                  }}
                  className="gi-modal-input"
                />
              </div>

              <div className="gi-modal-group">
                <label>Hora Fin</label>
                <input 
                  type="time"
                  value={rondaData.fin}
                  onChange={(e) => setRondaData({...rondaData, fin: e.target.value})}
                  className="gi-modal-input"
                />
              </div>

              <div className="gi-modal-actions">
                <button 
                  className="gi-modal-btn-cancel"
                  onClick={() => setShowRondaModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="gi-modal-btn-save"
                  onClick={() => {
                    if (!rondaData.zona || !rondaData.inicio || !rondaData.fin) {
                      alert("Por favor completa todos los campos (Zona, Inicio y Fin).");
                      return;
                    }

                    // Validar que la hora de inicio no sea anterior a la hora actual
                    const horaActual = getHoraActual();
                    if (rondaData.inicio < horaActual) {
                      alert("La hora de inicio no puede ser anterior a la hora actual (" + horaActual + ").");
                      return;
                    }

                    wsService.send({
                      tipo: "nueva_ronda",
                      guardia: user?.nombre || "Guardia",
                      zona: rondaData.zona,
                      inicio: rondaData.inicio,
                      fin: rondaData.fin
                    });

                    // Guardar en localStorage
                    const nuevaRondaGuardada = {
                      zona: rondaData.zona,
                      inicio: rondaData.inicio,
                      fin: rondaData.fin,
                      fecha: new Date().toLocaleDateString()
                    };
                    const actualizadas = [nuevaRondaGuardada, ...misRondas];
                    setMisRondas(actualizadas);
                    localStorage.setItem('mis_rondas_guardia', JSON.stringify(actualizadas));

                    alert("Ronda registrada exitosamente");
                    setShowRondaModal(false);
                    setRondaData({ zona: "", inicio: "", fin: "" });
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default GuardiaInfoScreen;