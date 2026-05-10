import { IonContent, IonPage } from "@ionic/react";
import BotonAlarma from "../components/ButtonAlarm";
import "./HomeScreen.css";

type Props = {
  onVerPerfil: () => void;
};

const HomeScreen: React.FC<Props> = ({ onVerPerfil }) => {
  return (
    <IonPage>
      <IonContent className="home-bg">
        <div className="home-phone">

          <div className="home-header">
            <div>
              <h3>Usuario activo</h3>
              <p>GPS activo</p>
            </div>

            <span>Zona A</span>
          </div>

          <BotonAlarma />

          <div className="info-mini-card">
            <h4>UBICACIÓN ACTUAL</h4>

            <div className="card-row">
              📍 <b>Zona A — Ingeniería</b>
            </div>

            <p>-1.2453, -78.6215</p>
          </div>

          <div className="info-mini-card">
            <h4>USUARIO ACTIVO</h4>

            <div className="card-row">
              👤 <b>Estudiante</b>
            </div>

            <p>Sistema activo</p>
          </div>

          <button
            className="perfil-btn"
            onClick={onVerPerfil}
          >
            Ver datos del usuario
          </button>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeScreen;