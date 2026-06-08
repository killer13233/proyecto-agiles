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
              setRondaData({ ...rondaData, zona: user?.zona || "" });
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
                  onChange={(e) => setRondaData({...rondaData, inicio: e.target.value})}
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

                    wsService.send({
                      tipo: "nueva_ronda",
                      guardia: user?.nombre || "Guardia",
                      zona: rondaData.zona,
                      inicio: rondaData.inicio,
                      fin: rondaData.fin
                    });

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