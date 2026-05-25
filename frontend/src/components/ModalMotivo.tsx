import { IonModal, IonContent } from "@ionic/react";
import { useState } from "react";
import "./ModalMotivo.css";

const MOTIVOS = [
  { id: "Robo",       icon: "🚫",  label: "Robo" },
  { id: "ArmaBlanca", icon: "⚠️",  label: "Arma blanca" },
  { id: "Acoso",      icon: "👤",  label: "Acoso" },
  { id: "Accidente",  icon: "💥",  label: "Accidente" },
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
    onConfirmar(
      motivoSeleccionado,
      motivoSeleccionado === "Otro" ? descripcion.trim() : undefined
    );
    setMotivoSeleccionado(null);
    setDescripcion("");
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancelar} className="modal-motivo">
      <IonContent>
        {/* Header — ícono de alerta activada */}
        <div className="modal-header-alerta">
          <div className="icono-alerta">⚠️</div>
          <p className="modal-header-texto">Botón de alarma activado</p>
        </div>

        {/* Sección de selección */}
        <div className="modal-body">
          <p className="modal-label">Selecciona el motivo</p>

          {/* Grid 2 columnas */}
          <div className="motivos-grid">
            {MOTIVOS.map((m) => (
              <button
                key={m.id}
                className={`motivo-btn ${motivoSeleccionado === m.id ? "selected" : ""}`}
                onClick={() => { setMotivoSeleccionado(m.id); setError(""); }}
              >
                <span className="motivo-icon">{m.icon}</span>
                <span className="motivo-label">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Otro — fila completa */}
          <button
            className={`motivo-btn motivo-otro ${motivoSeleccionado === "Otro" ? "selected" : ""}`}
            onClick={() => { setMotivoSeleccionado("Otro"); setError(""); }}
          >
            <span className="motivo-icon">···</span>
            <span className="motivo-label">Otro</span>
          </button>

          {/* Textarea si seleccionó Otro */}
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

          {/* Botón confirmar */}
          <button
            className="btn-confirmar"
            onClick={handleConfirmar}
            disabled={!motivoSeleccionado}
          >
            Confirmar y enviar alerta
          </button>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ModalMotivo;