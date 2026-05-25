import { useState } from "react";
import "./ModalMotivo.css";

export type Motivo = "Robo" | "Arma blanca" | "Acoso" | "Accidente" | "Otro";

const MOTIVOS: { label: Motivo; icono: string }[] = [
  { label: "Robo",        icono: "🚫" },
  { label: "Arma blanca", icono: "⚠️" },
  { label: "Acoso",       icono: "👤" },
  { label: "Accidente",   icono: "🚑" },
];

type Props = {
  visible: boolean;
  onConfirmar: (motivo: Motivo, descripcion: string) => void;
  onCancelar: () => void;
};

const ModalMotivo: React.FC<Props> = ({ visible, onConfirmar, onCancelar }) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<Motivo | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  if (!visible) return null;

  const handleConfirmar = () => {
    if (!motivoSeleccionado) {
      setError("Selecciona un motivo antes de continuar.");
      return;
    }
    if (motivoSeleccionado === "Otro" && !descripcion.trim()) {
      setError("Por favor describe brevemente el incidente.");
      return;
    }
    setError("");
    onConfirmar(motivoSeleccionado, descripcion);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-icono-alerta">⚠️</span>
          <p className="modal-subtitulo">Botón de alarma activado</p>
        </div>
        <h3 className="modal-titulo">Selecciona el motivo</h3>
        <div className="modal-grid">
          {MOTIVOS.map(({ label, icono }) => (
            <button
              key={label}
              className={`modal-opcion ${motivoSeleccionado === label ? "seleccionado" : ""}`}
              onClick={() => { setMotivoSeleccionado(label); setError(""); }}
            >
              <span className="modal-opcion-icono">{icono}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button
          className={`modal-otro ${motivoSeleccionado === "Otro" ? "seleccionado" : ""}`}
          onClick={() => { setMotivoSeleccionado("Otro"); setError(""); }}
        >
          💬 Otro
        </button>
        {motivoSeleccionado === "Otro" && (
          <textarea
            className="modal-descripcion"
            placeholder="Describe brevemente el incidente..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
        )}
        {error && <p className="modal-error">{error}</p>}
        <button className="modal-confirmar" onClick={handleConfirmar}>
          Confirmar y enviar alerta
        </button>
        <button className="modal-cancelar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ModalMotivo;