import { IonButton, IonContent, IonPage } from "@ionic/react";
import { Preferences } from "@capacitor/preferences";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import "./PerfilScreen.css"; // Reusing styles for consistency

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
};

const GuardiaInfoScreen: React.FC<Props> = ({ onVerAlertas, onCerrarSesion }) => {
  const [user, setUser] = useState<TokenData | null>(null);

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

  const rolUsuario =
    user?.role ||
    user?.rol ||
    (user as any)?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Guardia";

  return (
    <IonPage>
      <IonContent className="profile-bg">
        <div className="profile-phone">
          <div className="profile-header">
            <h2>Panel de Guardia</h2>
            <Avatar nombre={user?.nombre || "?"} />
            <h3>{user?.nombre}</h3>
            <p>{user?.email || user?.correo}</p>
            <span className={`role-badge guardia`}>{rolUsuario}</span>
          </div>

          <div className="info-card">
            <h4>DATOS DEL GUARDIA</h4>
            <div className="row">
              <span>Nombre completo</span>
              <b>{user?.nombre}</b>
            </div>
            <div className="row">
              <span>Correo institucional</span>
              <b>{user?.email || user?.correo || "Sin correo"}</b>
            </div>
            <div className="row">
              <span>Zona Asignada</span>
              <b>{user?.zona || "Sin zona asignada"}</b>
            </div>
            <div className="row">
              <span>Estado</span>
              <b className="active">En Servicio</b>
            </div>
          </div>

          <IonButton expand="block" className="primary-btn" onClick={onVerAlertas} style={{ marginTop: '20px' }}>
            🚨 Ver Alertas Activas
          </IonButton>

          <IonButton expand="block" className="logout-btn" onClick={onCerrarSesion} style={{ marginTop: '10px' }}>
            Cerrar sesión
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuardiaInfoScreen;
