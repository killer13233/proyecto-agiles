import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonTextarea, IonButton, IonButtons,
} from "@ionic/react";
import { useState } from "react";
import { cerrarAlerta } from "../services/alertasService";

interface Props {
  isOpen: boolean;
  alertaId: number;
  onClose: () => void;
  onCerrada: () => void;
}

const ModalCierre: React.FC<Props> = ({ isOpen, alertaId, onClose, onCerrada }) => {
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const handleConfirmar = async () => {
    if (!motivo.trim()) return;
    await cerrarAlerta(alertaId, motivo, descripcion);
    setMotivo("");
    setDescripcion("");
    onCerrada();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cerrar caso</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Cancelar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Motivo de resolución *</IonLabel>
          <IonInput
            value={motivo}
            onIonChange={(e) => setMotivo(e.detail.value!)}
            placeholder="Ej: Falsa alarma"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Descripción</IonLabel>
          <IonTextarea
            value={descripcion}
            onIonChange={(e) => setDescripcion(e.detail.value!)}
            rows={4}
            placeholder="Describe lo que ocurrió..."
          />
        </IonItem>
        <IonButton
          expand="block"
          color="danger"
          onClick={handleConfirmar}
          className="ion-margin-top"
          disabled={!motivo.trim()}
        >
          Confirmar cierre
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default ModalCierre;