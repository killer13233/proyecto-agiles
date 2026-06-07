import { IonButton, IonContent, IonPage } from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import "./PerfilScreen.css";

type Props = {
  onIrInicio: () => void;
  onIrAlarma: () => void;
  onIrGrupos?: () => void;
};

type TokenData = {
  nombre?: string;
  email?: string;
  correo?: string;
  role?: string;
  rol?: string;
  zona?: string;
  exp?: number;
};

const PerfilScreen: React.FC<Props> = ({
    onIrInicio,
    onIrAlarma,
    onIrGrupos,
    }) => {
  const [user, setUser] = useState<TokenData | null>(null);
  const [expired, setExpired] = useState(false);
  const rolUsuario =
  user?.role ||
  user?.rol ||
  (user as any)?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
  "Sin rol";
  const mostrarAlarma = rolUsuario.toLowerCase() === "estudiante" || rolUsuario.toLowerCase() === "docente";

  useEffect(() => {
    const cargarToken = () => {
      const value = localStorage.getItem("token");

      if (!value) {
        setExpired(true);
        return;
      }

      try {
        const decoded = jwtDecode<TokenData>(value);
        console.log("Token decodificado en Perfil:", decoded);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setExpired(true);
          return;
        }

        setUser(decoded);
      } catch (e) {
        console.error("Error decodificando token en Perfil:", e);
        setExpired(true);
      }
    };

    cargarToken();
  }, []);

  const cerrarSesion = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    window.location.reload();
  };
  

  if (expired) {
    return (
      <IonPage>
        <IonContent className="profile-bg">
          <div className="profile-phone">
            <div className="profile-header">
              <Avatar nombre="?" />
              <h2>Sesión no válida</h2>
            </div>
            <div className="expired-box">
              Sesión expirada. Por favor inicie sesión nuevamente.
            </div>
            <IonButton expand="block" className="primary-btn" onClick={cerrarSesion}>
              Ir al inicio de sesión
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
     <IonContent className="profile-bg" scrollY={true} forceOverscroll={false}>
        <div className="profile-phone">
          <div className="back-section">
            <p className="back" onClick={onIrInicio}>← Inicio</p>
          </div>

          <div className="profile-hero">
            <Avatar nombre={user?.nombre || "?"} />
            <span className={`role-badge ${rolUsuario.toLowerCase()}`}>
              {rolUsuario}
            </span>
            <h2>{user?.nombre}</h2>
            <p className="profile-email">{user?.email || user?.correo}</p>
          </div>

          <div className="perfil-card">
            <h4>DATOS PERSONALES</h4>
            <div className="row">
              <span>Nombre completo</span>
              <b>{user?.nombre}</b>
            </div>
            <div className="row">
              <span>Correo institucional</span>
              <b>{user?.email || user?.correo || "Sin correo"}</b>
            </div>
            <div className="row">
              <span>Rol</span>
              <b>{user?.role || user?.rol}</b>
            </div>
            <div className="row">
              <span>Estado</span>
              <b className="active">Activo</b>
            </div>
            <div className="row">
              <span>Zona asignada</span>
              <b>{user?.zona || "Sin zona"}</b>
            </div>
          </div>

          {/* Grupos de Confianza */}
          <div className="perfil-card" style={{ cursor: onIrGrupos ? 'pointer' : 'default' }} onClick={onIrGrupos}>
            <h4>GRUPOS DE CONFIANZA</h4>
            <div className="row">
              <span>🤝 Gestiona tus grupos</span>
              <b style={{ color: 'var(--app-primary)' }}>→</b>
            </div>
          </div>

          <div className="perfil-card">
            <h4>SESIÓN</h4>
            <div className="row">
              <span>Último acceso</span>
              <b>Hoy</b>
            </div>
            <div className="row">
              <span>Token expira en</span>
              <b>Activo</b>
            </div>
          </div>

          {mostrarAlarma && (
            <div className="alarma-section">
              <IonButton expand="block" className="alarma-btn" onClick={onIrAlarma}>
                <span className="alarma-icon">SOS</span>
                Enviar Alarma
              </IonButton>
            </div>
          )}

          <div className="bottom-actions">
            <IonButton expand="block" fill="outline" className="logout-btn" onClick={cerrarSesion}>
              Cerrar sesión
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PerfilScreen;
