import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonToggle,
  IonButtons, IonBadge,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Preferences } from "@capacitor/preferences";
import { getAlertas, asumirAlerta } from "../services/alertasService";
import { wsService } from "../services/wsService";
import ModalCierre from "../components/ModalCierre";

interface Alerta {
  id: number;
  nombreUsuario: string;
  motivo: string;
  zona: string;
  estado: string;
}

interface TokenData {
  sub?: string;
  nombre?: string;
}

const GuardiaScreen: React.FC = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [usuario, setUsuario] = useState<TokenData | null>(null);

  useEffect(() => {
    cargarUsuario();
    cargarAlertas();
    conectarWS();
    return () => wsService.disconnect();
  }, []);

  const cargarUsuario = async () => {
    const { value: token } = await Preferences.get({ key: "token" });
    if (token) setUsuario(jwtDecode<TokenData>(token));
  };

  const cargarAlertas = async () => {
    try {
      const data = await getAlertas("Activa");
      setAlertas(data);
    } catch (err) {
      console.error(err);
    }
  };

  const conectarWS = async () => {
    await wsService.connect();

    wsService.on("nueva_alerta", (data) => {
      setAlertas((prev) => [...prev, {
        id: data.alertaId,
        nombreUsuario: data.nombreUsuario,
        motivo: data.motivo,
        zona: data.zona,
        estado: "Activa",
      }]);
    });

    wsService.on("alerta_asumida", (data) => {
      setAlertas((prev) =>
        prev.map((a) => a.id === data.alertaId ? { ...a, estado: "Asumida" } : a)
      );
    });

    wsService.on("alerta_cerrada", (data) => {
      setAlertas((prev) => prev.filter((a) => a.id !== data.alertaId));
    });
  };

  const handleAsumir = async (alerta: Alerta) => {
    if (!usuario) return;
    await asumirAlerta(alerta.id, usuario.sub || "", usuario.nombre || "");
  };

  const handleCerrar = (alerta: Alerta) => {
    setAlertaSeleccionada(alerta);
    setModalVisible(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Alertas Activas</IonTitle>
          <IonButtons slot="end">
            <IonLabel style={{ marginRight: 8, fontSize: 13 }}>
              {disponible ? "Disponible" : "No disponible"}
            </IonLabel>
            <IonToggle
              checked={disponible}
              onIonChange={(e) => setDisponible(e.detail.checked)}
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {alertas.length === 0 && (
          <p style={{ textAlign: "center", marginTop: 40, color: "#999" }}>
            No hay alertas activas
          </p>
        )}
        <IonList>
          {alertas.map((alerta) => (
            <IonItem key={alerta.id}>
              <IonLabel>
                <h2>🚨 {alerta.motivo}</h2>
                <p>Usuario: {alerta.nombreUsuario}</p>
                <p>Zona: {alerta.zona}</p>
                <IonBadge color={alerta.estado === "Activa" ? "danger" : "warning"}>
                  {alerta.estado}
                </IonBadge>
              </IonLabel>
              <IonButton
                slot="end"
                color="warning"
                onClick={() => handleAsumir(alerta)}
                disabled={alerta.estado !== "Activa"}
              >
                Me acerco
              </IonButton>
              <IonButton
                slot="end"
                color="danger"
                onClick={() => handleCerrar(alerta)}
              >
                Cerrar
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <ModalCierre
          isOpen={modalVisible}
          alertaId={alertaSeleccionada?.id || 0}
          onClose={() => setModalVisible(false)}
          onCerrada={() => {
            setModalVisible(false);
            setAlertaSeleccionada(null);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default GuardiaScreen;