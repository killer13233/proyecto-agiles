import { IonPage, IonContent } from "@ionic/react";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./MiEstadoScreen.css";

interface Alerta {
  id: number;
  nombreUsuario: string;
  zona: string;
  motivo: string;
  estado: string;
  creadoEn?: string;
}

interface TokenData {
  sub?: string;
  nombre?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8090";

const MiEstadoScreen: React.FC = () => {
  const [disponible, setDisponible] = useState(true);
  const [alertasRecientes, setAlertasRecientes] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/alertas?estado=Activa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lista = Array.isArray(res.data)
        ? res.data
        : res.data?.alertas || [];
      setAlertasRecientes(lista.slice(0, 3));
    } catch {
      setAlertasRecientes([]);
    }
  };

  const handleToggle = async (nuevoEstado: boolean) => {
    setCargando(true);
    setDisponible(nuevoEstado);
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode<TokenData>(token || "");
      await axios.patch(
        `${API_BASE}/api/usuarios/${decoded.sub}/disponibilidad`,
        { disponible: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      setDisponible(!nuevoEstado);
    } finally {
      setCargando(false);
    }
  };

  const tiempoTranscurrido = (fecha?: string) => {
    if (!fecha) return "";
    const diff = Math.floor(
      (Date.now() - new Date(fecha).getTime()) / 60000
    );
    return diff < 1 ? "ahora" : `hace ${diff} min`;
  };

  return (
    <IonPage>
      <IonContent className="estado-bg">

        {/* Header azul */}
        <div className="estado-header">
          <h2>Mi estado</h2>
          <span className={`estado-badge-top ${disponible ? "verde" : "gris"}`}>
            {disponible ? "● En servicio" : "● Fuera de servicio"}
          </span>
        </div>

        <div className="estado-body">

          {/* Tarjeta En servicio */}
          <div className="tarjeta-disponibilidad">
            <div className="tarjeta-info">
              <span className="tarjeta-titulo">Disponibilidad</span>
              <span className="tarjeta-sub">
                En servicio · recibiendo alertas
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={disponible}
                disabled={cargando}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Alertas recientes — visibles solo si está disponible */}
          {disponible &&
            alertasRecientes.map((a) => (
              <div key={a.id} className="tarjeta-alerta-mini">
                <span className="alerta-mini-icon">🔔</span>
                <div className="alerta-mini-info">
                  <span className="alerta-mini-nombre">{a.nombreUsuario}</span>
                  <span className="alerta-mini-detalle">
                    {a.zona} · {a.motivo} · {tiempoTranscurrido(a.creadoEn)}
                  </span>
                </div>
                <span
                  className={`badge-mini ${
                    a.estado === "Activa" ? "nueva" : "activa-badge"
                  }`}
                >
                  {a.estado === "Activa" ? "Nueva" : "Activa"}
                </span>
              </div>
            ))}

          {/* Tarjeta Fuera de servicio */}
          <div className="tarjeta-disponibilidad">
            <div className="tarjeta-info">
              <span className="tarjeta-titulo">Disponibilidad</span>
              <span className="tarjeta-sub">
                Fuera de servicio · sin alertas
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!disponible}
                disabled={cargando}
                onChange={(e) => handleToggle(!e.target.checked)}
              />
              <span className={`slider ${!disponible ? "" : "apagado"}`}></span>
            </label>
          </div>

          {/* Mensaje cuando está fuera de servicio */}
          {!disponible && (
            <div className="sin-alertas-box">
              <span className="sin-alertas-icon">🔕</span>
              <p>No recibirás nuevas alertas</p>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

export default MiEstadoScreen;