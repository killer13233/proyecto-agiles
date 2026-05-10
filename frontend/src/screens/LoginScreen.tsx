import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonPage,
  IonText,
} from "@ionic/react";
import { useState } from "react";
import { login } from "../services/authService";
import { Preferences } from "@capacitor/preferences";
import "./LoginScreen.css";
import { jwtDecode } from "jwt-decode";

type TokenData = {
  role?: string;
  rol?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
};

type Props = {
  onLoginSuccess: (rol: string) => void;
};


const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);
  const [intentosPorUsuario, setIntentosPorUsuario] = useState<Record<string, number>>({});
  const [bloqueadoPorUsuario, setBloqueadoPorUsuario] = useState<Record<string, boolean>>({});
  const correoActual = email.trim().toLowerCase();
  const intentosActuales = intentosPorUsuario[correoActual] ?? 3;
  const bloqueadoActual = bloqueadoPorUsuario[correoActual] ?? false;
  
  const handleLogin = async () => {
  try {
    const data = await login(email, password);

    console.log(data);

    await Preferences.set({
      key: "token",
      value: data.token,
    });

    const decoded = jwtDecode<TokenData>(data.token);

    const rol =
    decoded.role ||
    decoded.rol ||
    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "";

    console.log("ROL LOGIN:", rol);

    setError(false);
    setMensaje("Login correcto");

    onLoginSuccess(rol);

  }  catch (err: any) {
  const mensajeBackend =
    err?.response?.data?.message ||
    err?.response?.data?.mensaje ||
    err?.response?.data ||
    "";

  const textoError = String(mensajeBackend).toLowerCase();

  if (
    textoError.includes("no encontrado") ||
    textoError.includes("no existe") ||
    textoError.includes("usuario")
  ) {
    setError(true);
    setMensaje("Usuario no encontrado.");
    return;
  }

  const nuevosIntentos = intentosActuales - 1;

  setIntentosPorUsuario({
    ...intentosPorUsuario,
    [correoActual]: nuevosIntentos,
  });

  setError(true);

  if (nuevosIntentos <= 0) {
    setBloqueadoPorUsuario({
      ...bloqueadoPorUsuario,
      [correoActual]: true,
    });

    setMensaje("Cuenta bloqueada. Contacte al administrador.");
  } else {
    setMensaje(`Credenciales incorrectas. Te quedan ${nuevosIntentos} intento(s).`);
  }
}
};

  return (
    <IonPage>
      <IonContent fullscreen className="login-bg">
        <div className="phone-card">
          <div className="login-header">
            <div className="logo-circle">UTA</div>
            <h2>Sistema de Seguridad</h2>
            <p>Campus UTA Huachi</p>
          </div>

          <div className="login-box">
            <h3>Iniciar sesión</h3>

            {mensaje && (
              <div className={error ? "alert-error" : "alert-success"}>
                {mensaje}
              </div>
            )}

            <label>Usuario institucional</label>
            <IonItem className={error ? "input-error" : "input-box"}>
              <span className="icon">👤</span>
              <IonInput
                type="email"
                placeholder="ej. mpalacios@uta.edu.ec"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
              />
            </IonItem>

            <label>Contraseña</label>
            <IonItem className={error ? "input-error" : "input-box"}>
              <span className="icon">🔒</span>
              <IonInput
                type="password"
                placeholder="********"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
              />
            </IonItem>

           <IonButton
                    expand="block"
                    className="login-btn"
                    onClick={handleLogin}
                    disabled={bloqueadoActual}
                    >
                    Ingresar
                    </IonButton>

            <IonText>
                <p className="login-help">
                   {bloqueadoActual
  ? "Cuenta bloqueada"
  : `${intentosActuales} intentos fallidos bloquean la cuenta`}
                </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};


export default LoginScreen;