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

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = async () => {
  try {

    const data = await login(email, password);

    console.log(data);

    await Preferences.set({
      key: "token",
      value: data.token,
    });

    setError(false);

    setMensaje("Login correcto");

  } catch {

    setError(true);

    setMensaje("Credenciales incorrectas. Intente nuevamente.");
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

            <IonButton expand="block" className="login-btn" onClick={handleLogin}>
              Ingresar
            </IonButton>

            <IonText>
              <p className="login-help">3 intentos fallidos bloquean la cuenta</p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginScreen;