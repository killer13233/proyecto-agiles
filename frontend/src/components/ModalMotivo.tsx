import { IonModal, IonContent, IonButton } from "@ionic/react";
import { useState } from "react";
import "./ModalMotivo.css";

const MOTIVOS = [
  { id: "Robo", icon: "🏃", label: "Robo" },
  { id: "ArmaBlanca", icon: "🔪", label: "Arma blanca" },
  { id: "Acoso", icon: "⚠️", label: "Acoso" },
  { id: "Accidente", icon: "🚑", label: "Accidente" },
  { id: "Otro", icon: "📋", label: "Otro" },
];

interface Props {
  isOpen: boolean;
  onConfirmar: (motivo: string, descripcion?: string) => void;
  onCancelar: () => void;
}

const ModalMotivo: React.FC<Props> = ({ isOpen, onConfirmar, onCancelar }) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  const handleConfirmar = () => {
    if (!motivoSeleccionado) {
      setError("Selecciona un motivo para continuar");
      return;
    }
    if (motivoSeleccionado === "Otro" && !descripcion.trim()) {
      setError("Por favor describe brevemente el incidente");
      return;
    }
    setError("");
    onConfirmar(motivoSeleccionado, descripcion.trim() || undefined);
    // reset
    setMotivoSeleccionado(null);
    setDescripcion("");
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancelar} className="modal-motivo">
      <IonContent className="ion-padding">
        <h2 className="modal-titulo">¿Qué tipo de emergencia?</h2>
        <div className="motivos-grid">
          {MOTIVOS.map((m) => (
            <button
              key={m.id}
              className={`motivo-btn ${motivoSeleccionado === m.id ? "selected" : ""}`}
              onClick={() => { setMotivoSeleccionado(m.id); setError(""); }}
            >
              <span className="motivo-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {motivoSeleccionado === "Otro" && (
          <textarea
            className="descripcion-input"
            placeholder="Describe brevemente el incidente..."
            value={descripcion}
            onChange={(e) => { setDescripcion(e.target.value); setError(""); }}
            rows={3}
          />
        )}

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-acciones">
          <IonButton fill="outline" color="medium" onClick={onCancelar} expand="block">
            Cancelar
          </IonButton>
          <IonButton
            color="danger"
            expand="block"
            onClick={handleConfirmar}
            disabled={!motivoSeleccionado}
          >
            Enviar alerta
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ModalMotivo;