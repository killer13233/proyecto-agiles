import { IonButton, IonContent, IonPage } from "@ionic/react";
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
  const [ultimoAcceso, setUltimoAcceso] = useState<string>("");
  const [expiraEn, setExpiraEn] = useState<string>("");

  const rolUsuario =
    user?.role ||
    user?.rol ||
    (user as any)?.[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ] ||
    "Sin rol";

  const esEstudiante =
    rolUsuario.toLowerCase().includes("estudiante");

  useEffect(() => {
    const cargarToken = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setExpired(true);
        return;
      }

      try {
        const decoded = jwtDecode<TokenData>(token);

        console.log("Token decodificado:", decoded);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setExpired(true);
          return;
        }

        setUser(decoded);

        // Fecha acceso actual
        const ahora = new Date();

        const hora = ahora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        setUltimoAcceso(`Hoy, ${hora}`);

        // Tiempo restante del token
        if (decoded.exp) {
          const tiempoRestante =
            decoded.exp * 1000 - Date.now();

          const horas = Math.floor(
            tiempoRestante / (1000 * 60 * 60)
          );

          const minutos = Math.floor(
            (tiempoRestante % (1000 * 60 * 60)) /
              (1000 * 60)
          );

          setExpiraEn(`${horas} h ${minutos} min`);
        }
      } catch (error) {
        console.error("Error token:", error);
        setExpired(true);
      }
    };

    cargarToken();
  }, []);

  const cerrarSesion = () => {
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

              <h2>Sesión expirada</h2>

              <div className="expired-box">
                🔒 Debe iniciar sesión nuevamente
              </div>

              <IonButton
                expand="block"
                className="primary-btn"
                onClick={cerrarSesion}
              >
                Ir al login
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="profile-bg">
        <div className="profile-phone">

          {/* HEADER */}
          <div className="profile-header">
            <p className="back" onClick={onIrInicio}>
              ← Inicio
            </p>

            <h2>Mi perfil</h2>

            <Avatar nombre={user?.nombre || "?"} />

            <h3>{user?.nombre}</h3>

            <p className="profile-email">
              {user?.email ||
                user?.correo ||
                "Sin correo"}
            </p>

            <span
              className={`role-badge ${rolUsuario.toLowerCase()}`}
            >
              {rolUsuario}
            </span>
          </div>

          {/* BOTÓN ALARMA */}
          {esEstudiante && (
            <IonButton
              expand="block"
              className="primary-btn"
              onClick={onIrAlarma}
            >
              ALARMA
            </IonButton>
          )}

          {/* DATOS */}
          <div className="info-card">
            <h4>DATOS PERSONALES</h4>

            <div className="row">
              <span>Nombre completo</span>
              <b>{user?.nombre}</b>
            </div>

            <div className="row">
              <span>Correo institucional</span>
              <b>
                {user?.email ||
                  user?.correo ||
                  "Sin correo"}
              </b>
            </div>

            <div className="row">
              <span>Rol</span>
              <b>{rolUsuario}</b>
            </div>

            <div className="row">
              <span>Estado</span>
              <b className="active">Activo</b>
            </div>

            <div className="row">
              <span>Zona asignada</span>
              <b>
                {user?.zona || "Zona A — Ingeniería"}
              </b>
            </div>
          </div>

          {/* SESIÓN */}
          <div className="info-card">
            <h4>SESIÓN</h4>

            <div className="row">
              <span>Último acceso</span>
              <b>{ultimoAcceso}</b>
            </div>

            <div className="row">
              <span>Token expira en</span>
              <b>{expiraEn || "Activo"}</b>
            </div>
          </div>

          {/* CERRAR SESIÓN */}
          <IonButton
            expand="block"
            className="logout-btn"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </IonButton>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default PerfilScreen;