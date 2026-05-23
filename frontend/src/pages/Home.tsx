import { useState, useEffect } from "react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";
import AdminDashboard from "../screens/AdminDashboard";
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
        body = `El guardia <strong>${data.nombreGuardia}</strong> se dirige al lugar.`;
        color = "#f59e0b";
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
    return () => {
      window.removeEventListener('app-nueva-alerta', handleNuevaAlerta);
      window.removeEventListener('app-alerta-asumida', handleNuevaAlerta);
    };
  }, []);

  // ✅ Al cargar, verificar si ya hay sesión
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
        if (lastScreen === "guardia" || lastScreen === "guardia-info") {
          setPantalla(lastScreen);
        } else {
          setPantalla("guardia-info");
        }
        // Conectamos el socket después de definir la pantalla
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



  // ✅ Guardar la pantalla actual cada vez que cambie
  useEffect(() => {
    if (pantalla && pantalla !== "login") {
      localStorage.setItem("last_screen", pantalla);
    }
  }, [pantalla]);

  // ✅ Guardar rol al hacer login
  const handleLoginSuccess = (rol: string) => {
    console.log("ROL RECIBIDO EN HOME:", rol);
    localStorage.setItem("rol", rol);
    if (rol === "Administrador") setPantalla("admin");
    else if (rol === "Guardia") setPantalla("guardia-info");
    else setPantalla("perfil");
  };

  // ✅ Limpiar al cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    setPantalla("login");
  };
 
  // ✅ Función para redirigir a la alerta desde la notificación
  const irAAlerta = () => {
    const rol = localStorage.getItem("rol");
    if (rol === "Guardia") {
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
      {pantalla === "admin" && <AdminDashboard />}
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