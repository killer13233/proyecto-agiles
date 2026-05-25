import { useState, useEffect } from "react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";
import AdminDashboard from "../screens/AdminDashboard";
import GuardiaScreen from "../screens/GuardiaScreen";
import GuardiaInfoScreen from "../screens/GuardiaInfoScreen";
import MiEstadoScreen from "../screens/MiEstadoScreen";   // ← nuevo import
import NotificacionAlerta from "../components/NotificacionAlerta";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { wsService } from "../services/wsService";

const Home: React.FC = () => {
  const [pantalla, setPantalla] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<any | null>(null);

  useEffect(() => {
    const handleNuevaAlerta = (e: any) => {
      const data = e.detail;
      let title = "¡NUEVA EMERGENCIA!";
      let body = `<strong>${data.nombreUsuario}</strong> solicita ayuda por: <strong>${data.motivo}</strong>`;
      let color = "#ef4444";

      if (data.tipo === 'alerta_asumida') {
        title = "ALERTA ASUMIDA";
        body = `El guardia <strong>${data.nombreGuardia}</strong> se dirige al lugar.`;
        color = "#f59e0b";
      }

      Haptics.impact({ style: ImpactStyle.Heavy });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(err => console.log("Audio play blocked by browser"));
      setNotificacion({ ...data, title, body, color });
    };

    window.addEventListener('app-nueva-alerta', handleNuevaAlerta);
    window.addEventListener('app-alerta-asumida', handleNuevaAlerta);
    return () => {
      window.removeEventListener('app-nueva-alerta', handleNuevaAlerta);
      window.removeEventListener('app-alerta-asumida', handleNuevaAlerta);
    };
  }, []);

  useEffect(() => {
    const initAuthAndWS = async () => {
      const token = localStorage.getItem("token");
      const rol = localStorage.getItem("rol");
      const lastScreen = localStorage.getItem("last_screen");

      if (!token || !rol) {
        setPantalla("login");
        return;
      }

      const rolNormalizado = rol.toLowerCase();

      if (rolNormalizado === "administrador") {
        setPantalla("admin");
      } else if (rolNormalizado === "guardia") {
        if (lastScreen === "guardia" || lastScreen === "guardia-info" || lastScreen === "mi-estado") {
          setPantalla(lastScreen);   // ← agrega "mi-estado" al lastScreen válido
        } else {
          setPantalla("guardia-info");
        }
        setTimeout(async () => {
          try {
            await wsService.connect();
            console.log("WS conectado globalmente en Home");
            wsService.send({ tipo: "disponibilidad", disponible: true });
          } catch (e) {
            console.error("Error conectando WS:", e);
          }
        }, 500);
      } else {
        if (lastScreen === "perfil" || lastScreen === "home") {
          setPantalla(lastScreen);
        } else {
          setPantalla("home");
        }
      }
    };

    initAuthAndWS();

    return () => {
      const rol = localStorage.getItem("rol");
      if (rol?.toLowerCase() === "guardia") {
        wsService.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (pantalla && pantalla !== "login") {
      localStorage.setItem("last_screen", pantalla);
    }
  }, [pantalla]);

  const handleLoginSuccess = (rol: string) => {
    console.log("ROL RECIBIDO EN HOME:", rol);
    localStorage.setItem("rol", rol);
    if (rol === "Administrador") setPantalla("admin");
    else if (rol === "Guardia") setPantalla("guardia-info");
    else setPantalla("perfil");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    setPantalla("login");
  };

  const irAAlerta = () => {
    const rol = localStorage.getItem("rol");
    if (rol === "Guardia") {
      setPantalla("guardia");
    } else {
      alert("Solo los guardias pueden gestionar alertas.");
    }
    setNotificacion(null);
  };

  if (pantalla === null) return null;

  return (
    <>
      <NotificacionAlerta
        alerta={notificacion}
        onClose={() => setNotificacion(null)}
        onVerDetalles={irAAlerta}
      />
      {pantalla === "login"       && <LoginScreen onLoginSuccess={handleLoginSuccess} />}
      {pantalla === "admin"       && <AdminDashboard />}
      {pantalla === "guardia-info" && (
        <GuardiaInfoScreen
          onVerAlertas={() => setPantalla("guardia")}
          onCerrarSesion={handleLogout}
          onMiEstado={() => setPantalla("mi-estado")}   // ← nuevo prop
        />
      )}
      {pantalla === "guardia"     && <GuardiaScreen onIrInicio={() => setPantalla("guardia-info")} />}
      {pantalla === "mi-estado"   && (                  // ← nueva pantalla
        <MiEstadoScreen onVolver={() => setPantalla("guardia-info")} />
      )}
      {pantalla === "perfil"      && (
        <PerfilScreen
          onIrInicio={handleLogout}
          onIrAlarma={() => setPantalla("home")}
        />
      )}
      {pantalla === "home"        && <HomeScreen onVerPerfil={() => setPantalla("perfil")} />}
    </>
  );
};

export default Home;