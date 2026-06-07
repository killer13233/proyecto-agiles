import { useState, useEffect } from "react";
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from "@ionic/react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";
import GuardiaScreen from "../screens/GuardiaScreen";
import GuardiaInfoScreen from "../screens/GuardiaInfoScreen";
import GruposConfianzaScreen from "../screens/GruposConfianzaScreen";
import NotificacionAlerta from "../components/NotificacionAlerta";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { wsService } from "../services/wsService";
const Home: React.FC = () => {
  const [pantalla, setPantalla] = useState<string | null>(null); // null = cargando
  const [notificacion, setNotificacion] = useState<any | null>(null);
  const [alertaConfianzaSeleccionada, setAlertaConfianzaSeleccionada] = useState<any | null>(null);
 
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

    const handleInvitacion = (e: any) => {
        const data = e.detail;
        setNotificacion({
            title: "NUEVA INVITACIÓN",
            body: `Te invitaron al grupo: <strong>${data.grupoNombre}</strong>`,
            color: "#3b82f6"
        });
        Haptics.impact({ style: ImpactStyle.Medium });
    };

    const handleAlertaConfianza = (e: any) => {
        const data = e.detail;
        setNotificacion({
            tipo_notificacion: "confianza",
            title: "EMERGENCIA DE CONTACTO",
            body: `<strong>${data.nombreUsuario}</strong> tiene una emergencia: <strong>${data.motivo}</strong>`,
            color: "#9333ea", // Purple for trust contact emergency
            ...data
        });
        Haptics.impact({ style: ImpactStyle.Heavy });
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(err => console.log("Audio play blocked by browser"));
    };

    window.addEventListener('app-nueva-alerta', handleNuevaAlerta);
    window.addEventListener('app-alerta-asumida', handleNuevaAlerta);
    window.addEventListener('app-alerta-cerrada', handleNuevaAlerta);
    window.addEventListener('app-nueva-invitacion', handleInvitacion);
    window.addEventListener('app-alerta-confianza', handleAlertaConfianza);
    return () => {
      window.removeEventListener('app-nueva-alerta', handleNuevaAlerta);
      window.removeEventListener('app-alerta-asumida', handleNuevaAlerta);
      window.removeEventListener('app-alerta-cerrada', handleNuevaAlerta);
      window.removeEventListener('app-nueva-invitacion', handleInvitacion);
      window.removeEventListener('app-alerta-confianza', handleAlertaConfianza);
    };
  }, []);

  // ✅ Restaurar sesión si hay token guardado
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    // Verificar si el token expiró
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      const ahora = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < ahora) {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        localStorage.removeItem("last_screen");
        setPantalla("login");
        return;
      }
    } catch {
      localStorage.removeItem("token");
      setPantalla("login");
      return;
    }

    const rol = localStorage.getItem("rol") || "";
    if (rol.toLowerCase().includes("guardia")) {
      wsService.reset();
      wsService.connect();
    }

    const last = localStorage.getItem("last_screen");
    if (last) {
      setPantalla(last);
    } else {
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
 
  const irAAlerta = () => {
    if (notificacion?.tipo_notificacion === "confianza") {
      setAlertaConfianzaSeleccionada(notificacion);
      setNotificacion(null);
      return;
    }

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
          onIrGrupos={() => setPantalla("grupos-confianza")}
        />
      )}
      {pantalla === "grupos-confianza" && (
        <GruposConfianzaScreen onVolver={() => setPantalla("perfil")} />
      )}
      {pantalla === "home" && <HomeScreen onVerPerfil={() => setPantalla("perfil")} />}

      {/* MODAL DETALLE ALERTA CONFIANZA */}
      <IonModal isOpen={!!alertaConfianzaSeleccionada} onDidDismiss={() => setAlertaConfianzaSeleccionada(null)} className="detalle-alerta-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Emergencia de Contacto</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setAlertaConfianzaSeleccionada(null)}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {alertaConfianzaSeleccionada && (
            <div className="da-container" style={{ padding: '20px' }}>
              <div className="da-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <span className="da-emoji" style={{ fontSize: '3rem' }}>🚨</span>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>{alertaConfianzaSeleccionada.motivo}</h2>
                  <span className="da-badge" style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Activa
                  </span>
                </div>
              </div>
              <div className="da-body" style={{ background: '#1f1f1f', padding: '15px', borderRadius: '8px' }}>
                <div className="da-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
                  <span className="da-label" style={{ color: '#888' }}>Usuario Contacto</span>
                  <span className="da-value" style={{ fontWeight: 'bold', color: 'white' }}>{alertaConfianzaSeleccionada.nombreUsuario}</span>
                </div>
                {alertaConfianzaSeleccionada.latitud && alertaConfianzaSeleccionada.longitud && (
                  <div className="da-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
                    <span className="da-label" style={{ color: '#888' }}>Coordenadas</span>
                    <span className="da-value" style={{ color: 'white' }}>{Number(alertaConfianzaSeleccionada.latitud).toFixed(4)}, {Number(alertaConfianzaSeleccionada.longitud).toFixed(4)}</span>
                  </div>
                )}
                {alertaConfianzaSeleccionada.creadaEn && (
                  <div className="da-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span className="da-label" style={{ color: '#888' }}>Creada</span>
                    <span className="da-value" style={{ color: 'white' }}>
                      {(() => {
                        const s = alertaConfianzaSeleccionada.creadaEn.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(alertaConfianzaSeleccionada.creadaEn) 
                          ? alertaConfianzaSeleccionada.creadaEn 
                          : alertaConfianzaSeleccionada.creadaEn + 'Z';
                        return new Date(s).toLocaleString("es-EC", { timeZone: "America/Guayaquil", dateStyle: "short", timeStyle: "short" });
                      })()}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Esta alerta está siendo atendida por los guardias de seguridad. Permanece en un lugar seguro.</p>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};


export default Home;