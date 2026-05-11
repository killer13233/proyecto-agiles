import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonToggle,
  IonButtons, IonBadge, IonModal
} from "@ionic/react";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Preferences } from "@capacitor/preferences";
import { getAlertas, asumirAlerta, getZonas } from "../services/alertasService";
import { wsService } from "../services/wsService";
import ModalCierre from "../components/ModalCierre";
import MapaAlerta from "../components/MapaAlerta";


interface Alerta {
  id: number;
  nombreUsuario: string;
  motivo: string;
  zona: string;
  estado: string;
  latitud: number;
  longitud: number;
}

interface TokenData {
  sub?: string;
  nombre?: string;
}

interface GuardiaProps {
  onIrInicio?: () => void;
}

const GuardiaScreen: React.FC<GuardiaProps> = ({ onIrInicio }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMapaVisible, setModalMapaVisible] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [usuario, setUsuario] = useState<TokenData | null>(null);

  useEffect(() => {
    let cancelado = false;

    const init = async () => {
      await cargarUsuario();
      await cargarAlertas();
      await cargarZonas();

      // ✅ Esperar que StrictMode termine su ciclo de desmontaje
      await new Promise((r) => setTimeout(r, 150));

      if (!cancelado) {
        await conectarWS();
      }
    };

    init();

    return () => {
      cancelado = true;
      wsService.disconnect();
    };
  }, []);

  const cargarUsuario = async () => {
    const { value: token } = await Preferences.get({ key: "token" });
    if (token) setUsuario(jwtDecode<TokenData>(token));
  };

  const cargarAlertas = async () => {
    try {
      const data = await getAlertas("Activa");
      console.log("DATA ALERTAS RAW:", data);
      const alertasLista = Array.isArray(data) ? data : (data?.alertas || []);
      
      const alertasFiltradas = alertasLista.filter((a: any) => 
        (a.estado || a.Estado) !== 'Cerrada'
      );
      
      console.log("ALERTAS FILTRADAS:", alertasFiltradas);
      setAlertas(alertasFiltradas);
    } catch (err) {
      console.error("Error cargando alertas:", err);
      setAlertas([]);
    }
  };

  const cargarZonas = async () => {
    try {
      const data = await getZonas();
      const zonasLista = Array.isArray(data) ? data : (data?.zonas || []);
      setZonas(zonasLista);
    } catch (err) {
      console.error("Error cargando zonas:", err);
    }
  };



  const conectarWS = async () => {
    await wsService.connect();

    wsService.on("nueva_alerta", (data) => {
      setAlertas((prev) => {
        const existe = prev.some((a) => a.id === data.alertaId);
        if (existe) return prev;
        return [...prev, {
          id: data.alertaId,
          nombreUsuario: data.nombreUsuario,
          motivo: data.motivo,
          zona: data.zona,
          estado: "Activa",
          latitud: data.latitud || -1.269451,
          longitud: data.longitud || -78.623277,
        }];
      });
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
    setAlertaSeleccionada(alerta);
    setModalMapaVisible(true);
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
          <IonButtons slot="start">
            <IonButton onClick={onIrInicio}>
              ← Volver
            </IonButton>
          </IonButtons>
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

        <IonModal isOpen={modalMapaVisible} onDidDismiss={() => setModalMapaVisible(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Ubicación de la Alerta</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setModalMapaVisible(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {alertaSeleccionada && (
              <MapaAlerta 
                lat={alertaSeleccionada.latitud} 
                lng={alertaSeleccionada.longitud} 
                motivo={alertaSeleccionada.motivo} 
                height="60vh"
                zonas={zonas}
              />
            )}
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p><strong>Alerta:</strong> {alertaSeleccionada?.motivo}</p>
              <p><strong>Zona:</strong> {alertaSeleccionada?.zona}</p>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default GuardiaScreen;