import { IonButton, IonContent, IonPage } from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import "./PerfilScreen.css";


type Props = {
  onIrInicio: () => void;
  onIrAlarma: () => void;
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
    }) => {
  const [user, setUser] = useState<TokenData | null>(null);
  const [expired, setExpired] = useState(false);
  const rolUsuario =
  user?.role ||
  user?.rol ||
  (user as any)?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
  "Sin rol";
  const esEstudiante = rolUsuario.toLowerCase() === "estudiante";
  useEffect(() => {
    const cargarToken = async () => {
      const { value } = await Preferences.get({ key: "token" });

      if (!value) {
        setExpired(true);
        return;
      }

      const decoded = jwtDecode<TokenData>(value);
      console.log(decoded);
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        setExpired(true);
        return;
      }

      setUser(decoded);
    };

    cargarToken();
  }, []);

  const cerrarSesion = async () => {
    await Preferences.remove({ key: "token" });
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
              🔒 Sesión expirada. Por favor inicie sesión nuevamente.
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
      <IonContent className="profile-bg">
        <div className="profile-phone">
          <div className="profile-header">
            <p className="back" onClick={onIrInicio}>
            ← Inicio
            </p>
            <h2>Mi perfil</h2>

            <Avatar nombre={user?.nombre || "?"} />

            <h3>{user?.nombre}</h3>
            <p>{user?.email || user?.correo}</p>

        <span className={`role-badge ${rolUsuario.toLowerCase()}`}>
            {rolUsuario}
        </span>         
        </div>

          <div className="info-card">
            <h4>DATOS PERSONALES</h4>

            <div className="row">
              <span>Nombre completo</span>
              <b>{user?.nombre}</b>
            </div>

            <div className="row">
              <span>Correo institucional</span>
             <b>{user?.email || user?.correo || (user as any)?.["email"] || "Sin correo"}</b>
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

          <div className="info-card">
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

          {esEstudiante && (
            <IonButton
              expand="block"
              className="primary-btn"
              onClick={onIrAlarma}
            >
              Alarma
            </IonButton>
          )}

            <IonButton expand="block" className="logout-btn" onClick={cerrarSesion}>
            Cerrar sesión
            </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PerfilScreen;