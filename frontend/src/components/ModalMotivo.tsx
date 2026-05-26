import { useEffect, useRef, useState } from "react";
import "./ModalMotivo.css";

export type MotivoEmergencia = "Robo" | "Arma blanca" | "Acoso" | "Accidente" | "Otro";

interface Props {
  visible: boolean;
  onConfirmar: (motivo: MotivoEmergencia, descripcion?: string) => void;
  onCancelar: () => void;
}

const MOTIVOS: { key: MotivoEmergencia; icono: string }[] = [
  { key: "Robo",        icono: "🚫" },
  { key: "Arma blanca", icono: "⚠️" },
  { key: "Acoso",       icono: "🙍" },
  { key: "Accidente",   icono: "💥" },
];

const ModalMotivo: React.FC<Props> = ({ visible, onConfirmar, onCancelar }) => {
  const [seleccionado, setSeleccionado] = useState<MotivoEmergencia | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [errorDesc, setErrorDesc] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setSeleccionado(null);
      setDescripcion("");
      setErrorDesc(false);
    }
  }, [visible]);

  useEffect(() => {
    if (seleccionado === "Otro") {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [seleccionado]);

  if (!visible) return null;

const handleConfirmar = () => {
  if (!seleccionado) return;
  onConfirmar(seleccionado, seleccionado === "Otro" ? descripcion.trim() : undefined);
};

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="modal-top-area">
          <div className="modal-alarm-icon">⚠️</div>
          <p className="modal-alarm-label">Botón de alarma activado</p>
        </div>

        <div className="modal-body">
          <h3 className="modal-title">Selecciona el motivo</h3>

          <div className="motivos-grid">
            {MOTIVOS.map(({ key, icono }) => (
              <button
                key={key}
                className={`motivo-btn ${seleccionado === key ? "selected" : ""}`}
                onClick={() => { setSeleccionado(key); setErrorDesc(false); }}
              >
                <span className="motivo-icono">{icono}</span>
                <span className="motivo-label">{key}</span>
              </button>
            ))}
            <button
              className={`motivo-btn otro-btn ${seleccionado === "Otro" ? "selected" : ""}`}
              onClick={() => { setSeleccionado("Otro"); setErrorDesc(false); }}
            >
              <span className="motivo-icono">···</span>
              <span className="motivo-label">Otro</span>
            </button>
          </div>

          {seleccionado === "Otro" && (
            <div className="otro-container">
             <textarea
                ref={textareaRef}
               className="otro-input"
                placeholder="Describe brevemente el incidente..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
               rows={3}
                maxLength={200}
               />
               </div>
        )}

          <button
            className={`confirmar-btn ${!seleccionado ? "disabled" : ""}`}
            onClick={handleConfirmar}
            disabled={!seleccionado}
          >
            Confirmar y enviar alerta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMotivo;