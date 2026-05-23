import { useState, useEffect } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { useHistory } from "react-router-dom";
import BotonAlarma from "../components/ButtonAlarm";
import "./HomeScreen.css";
import { obtenerUbicacion } from "../services/gpsService";

type Props = {
  onVerPerfil: () => void;
};

const HomeScreen: React.FC<Props> = ({ onVerPerfil }) => {
  const history = useHistory();
  const [zona, setZona] = useState("Obteniendo zona...");
  const [coordenadas, setCoordenadas] = useState({ lat: 0, lon: 0 });
  const [usuario, setUsuario] = useState({ nombre: "", rol: "" });
  const [gpsActivo, setGpsActivo] = useState(false);

  useEffect(() => {
    // Cargar datos del usuario desde el token
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const rol = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role || "Usuario";
        const nombre = payload.nombre || payload.name || "Usuario";
        const zonaToken = payload.zona || "";
        setUsuario({ nombre, rol });
        if (zonaToken) setZona(zonaToken);
      } catch (e) {
        console.error("Error decodificando token", e);
      }
    }

    // Obtener GPS
    const cargarGps = async () => {
      try {
        const pos = await obtenerUbicacion();
        setCoordenadas({ lat: pos.latitud, lon: pos.longitud });
        setGpsActivo(true);

        // Consultar zona desde el backend
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8090";
        const res = await fetch(`${API_BASE}/api/zonas/punto?lat=${pos.latitud}&lon=${pos.longitud}`);
        if (res.ok) {
          const data = await res.json();
          setZona(data.zona || "Zona No Definida");
        }
      } catch (e) {
        setGpsActivo(false);
        setZona("GPS desactivado");
      }
    };

    cargarGps();
  }, []);

  return (
    <IonPage>
      <IonContent className="home-bg">
        <div className="home-phone">

          <div className="home-header">
            <div>
              <h3>Usuario activo</h3>
              <p>{gpsActivo ? "GPS activo" : "GPS desactivado"}</p>
            </div>
            <span>{zona}</span>
          </div>

          <BotonAlarma />

          <div className="info-mini-card">
            <h4>UBICACIÓN ACTUAL</h4>
            <div className="card-row">
              📍 <b>{zona}</b>
            </div>
            <p>{gpsActivo ? `${coordenadas.lat.toFixed(4)}, ${coordenadas.lon.toFixed(4)}` : "Sin coordenadas"}</p>
          </div>

          <div className="info-mini-card">
            <h4>USUARIO ACTIVO</h4>
            <div className="card-row">
              👤 <b>{usuario.rol || "Estudiante"}</b>
            </div>
            <p>{usuario.nombre || "Sistema activo"}</p>
          </div>

          <button className="perfil-btn" onClick={onVerPerfil}>
            Ver datos del usuario
          </button>

          <button className="perfil-btn" onClick={() => history.push('/mapa')}>
            🗺️ Ver mapa del campus
          </button>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeScreen;