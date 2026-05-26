import { IonContent, IonPage } from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
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

const GuardiaInfoScreen: React.FC<Props> = ({ onVerAlertas, onCerrarSesion }) => {
  const [user, setUser] = useState<TokenData | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode<TokenData>(token);
        setUser(decoded);
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

  return (
    <IonPage>
      <IonContent className="gi-bg">
        <div className="gi-phone">

          {/* Header */}
          <div className="gi-header">
            <div className="gi-header-top">
              <span className={`gi-status-dot ${disponible ? "dot-verde" : "dot-gris"}`} />
              <span className="gi-status-text">
                {disponible ? "En servicio" : "Fuera de servicio"}
              </span>
            </div>
            <h2 className="gi-title">Mi estado</h2>
          </div>

          {/* Card disponibilidad ON */}
          <div className={`gi-card gi-card-toggle ${disponible ? "card-active" : ""}`}>
            <div className="gi-card-left">
              <p className="gi-card-title">Disponibilidad</p>
              <p className="gi-card-sub">
                {disponible ? "En servicio · recibiendo alertas" : "Fuera de servicio · sin alertas"}
              </p>
            </div>
            <button
              className={`gi-toggle ${disponible ? "toggle-on" : "toggle-off"} ${guardando ? "toggle-loading" : ""}`}
              onClick={handleToggle}
              disabled={guardando}
              aria-label="Toggle disponibilidad"
            >
              <span className="gi-toggle-thumb" />
            </button>
          </div>

          {/* Lista de alertas recientes (solo cuando disponible) */}
          {disponible ? (
            <div className="gi-alertas-list">
              <div className="gi-alerta-item" onClick={onVerAlertas}>
                <div className="gi-alerta-icon">🔔</div>
                <div className="gi-alerta-info">
                  <p className="gi-alerta-nombre">María López</p>
                  <p className="gi-alerta-detalle">Zona A · Robo · hace 1 min</p>
                </div>
                <span className="gi-badge badge-nueva">Nueva</span>
              </div>

              <div className="gi-alerta-item" onClick={onVerAlertas}>
                <div className="gi-alerta-icon">🙍</div>
                <div className="gi-alerta-info">
                  <p className="gi-alerta-nombre">Carlos Ruiz</p>
                  <p className="gi-alerta-detalle">Zona B · Acoso · hace 6 min</p>
                </div>
                <span className="gi-badge badge-activa">Activa</span>
              </div>
            </div>
          ) : (
            /* Estado fuera de servicio */
            <div className="gi-offline-card">
              <div className="gi-card gi-card-toggle">
                <div className="gi-card-left">
                  <p className="gi-card-title">Disponibilidad</p>
                  <p className="gi-card-sub">Fuera de servicio · sin alertas</p>
                </div>
                <button className="gi-toggle toggle-off" onClick={handleToggle} aria-label="Activar">
                  <span className="gi-toggle-thumb" />
                </button>
              </div>
              <div className="gi-no-alertas">
                <span className="gi-no-alertas-icon">🔕</span>
                <p>No recibirás nuevas alertas</p>
              </div>
            </div>
          )}

          {/* Botón ir a alertas */}
          {disponible && (
            <button className="gi-ver-alertas-btn" onClick={onVerAlertas}>
              🚨 Ver alertas activas
            </button>
          )}

          {/* Cerrar sesión */}
          <button className="gi-logout-btn" onClick={onCerrarSesion}>
            Cerrar sesión
          </button>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuardiaInfoScreen;