import { useState, useEffect } from "react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";
import GuardiaScreen from "../screens/GuardiaScreen";
import GuardiaInfoScreen from "../screens/GuardiaInfoScreen";
import NotificacionAlerta from "../components/NotificacionAlerta";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { wsService } from "../services/wsService";
const Home: React.FC = () => {
  const [pantalla, setPantalla] = useState<string | null>(null); // null = cargando
  const [notificacion, setNotificacion] = useState<any | null>(null);
 
  // ✅ Efecto para escuchar notificaciones globales de WebSockets
  useEffect(() => {
    const handleNuevaAlerta = (e: any) => {
      const data = e.detail;
      
      let title = "¡NUEVA EMERGENCIA!";
      let body = `<strong>${data.nombreUsuario}</strong> solicita ayuda por: <strong>${data.motivo}</strong>`;
      let color = "#ef4444";

      if (data.tipo === 'alerta_asumida') {
        title = "ALERTA ASUMIDA";
        const nombreGuardia = data.nombreGuardia || data.asumidaPorNombre || "Guardia";
        body = `Guardia: <strong>${nombreGuardia}</strong> se dirige al lugar.`;
        color = "#f59e0b";
      }

      if (data.tipo === 'alerta_cerrada') {
        title = "ALERTA CERRADA";
        body = `El caso <strong>#${data.alertaId}</strong> ha sido cerrado.`;
        color = "#22c55e";
      }

      // 1. Vibración (Haptic Feedback)
      Haptics.impact({ style: ImpactStyle.Heavy });
      
      // 2. Sonido de Alerta
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(err => console.log("Audio play blocked by browser"));
      
      // 3. Mostrar banner con datos dinámicos
      setNotificacion({ ...data, title, body, color });
    };

    window.addEventListener('app-nueva-alerta', handleNuevaAlerta);
    window.addEventListener('app-alerta-asumida', handleNuevaAlerta);
    window.addEventListener('app-alerta-cerrada', handleNuevaAlerta);
    return () => {
      window.removeEventListener('app-nueva-alerta', handleNuevaAlerta);
      window.removeEventListener('app-alerta-asumida', handleNuevaAlerta);
      window.removeEventListener('app-alerta-cerrada', handleNuevaAlerta);
    };
  }, []);

  // ✅ Restaurar sesión si hay token guardado
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const rol = localStorage.getItem("rol") || "";
    if (rol.toLowerCase().includes("guardia")) {
      wsService.reset();
      wsService.connect();
    }
      const last = localStorage.getItem("last_screen");
      if (last) {
        setPantalla(last);
      } else {
        const rol = localStorage.getItem("rol") || "";
        if (rol.toLowerCase().includes("guardia")) {
          setPantalla("guardia");
        } else {
          setPantalla("perfil");
        }
      }
    } else {
      setPantalla("login");
    }
  }, []);



  // ✅ Guardar la pantalla actual cada vez que cambie
  useEffect(() => {
    if (pantalla && pantalla !== "login") {
      localStorage.setItem("last_screen", pantalla);
    }
  }, [pantalla]);

  // ✅ Guardar rol al hacer login
  const handleLoginSuccess = (rol: string) => {
    const rolNormalizado = String(rol || "").trim().toLowerCase();
    console.log("ROL RECIBIDO EN HOME:", rol, "=>", rolNormalizado);

    localStorage.setItem("rol", rol);
    localStorage.removeItem("last_screen");

    if (rolNormalizado.includes("guardia") || rolNormalizado.includes("guard")) {
      setPantalla("guardia-info");
      return;
    }

    setPantalla("perfil");
  };

  // ✅ Limpiar al cerrar sesión
  const handleLogout = () => {
  wsService.disconnect(); // ← agregar
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  localStorage.removeItem("last_screen");
  setPantalla("login");
};
 
  // ✅ Función para redirigir a la alerta desde la notificación
  const irAAlerta = () => {
    const rol = localStorage.getItem("rol") || "";
    if (rol.toLowerCase().includes("guardia")) {
      setPantalla("guardia");
    } else {
      alert("Solo los guardias pueden gestionar alertas.");
    }
    setNotificacion(null);
  };
 
  // Mientras verifica sesión, no mostrar nada
  if (pantalla === null) return null;


  return (
    <>
      <NotificacionAlerta 
        alerta={notificacion} 
        onClose={() => setNotificacion(null)} 
        onVerDetalles={irAAlerta} 
      />
      {pantalla === "login" && <LoginScreen onLoginSuccess={handleLoginSuccess} />}
      {pantalla === "guardia-info" && (
        <GuardiaInfoScreen 
          onVerAlertas={() => setPantalla("guardia")} 
          onCerrarSesion={handleLogout} 
        />
      )}
      {pantalla === "guardia" && <GuardiaScreen onIrInicio={() => setPantalla("guardia-info")} />}
      {pantalla === "perfil" && (
        <PerfilScreen
          onIrInicio={handleLogout}
          onIrAlarma={() => setPantalla("home")}
        />
      )}
      {pantalla === "home" && <HomeScreen onVerPerfil={() => setPantalla("perfil")} />}
    </>
  );
};


export default Home;