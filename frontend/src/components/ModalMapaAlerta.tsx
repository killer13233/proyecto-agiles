import { useEffect, useRef, useState } from "react";
import "./ModalMotivo.css"; // reutilizamos los mismos estilos

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

const ModalMapaAlerta: React.FC<Props> = ({ visible, onConfirmar, onCancelar }) => {
  const [seleccionado, setSeleccionado] = useState<MotivoEmergencia | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [presionando, setPresionando] = useState(false);
  const [contador, setContador] = useState(3);
  const [progreso, setProgreso] = useState(0);
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setSeleccionado(null);
      setDescripcion("");
      setPresionando(false);
      setContador(3);
      setProgreso(0);
    }
  }, [visible]);

  useEffect(() => {
    if (seleccionado === "Otro") {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [seleccionado]);

  if (!visible) return null;

  const iniciarPresion = () => {
    if (!seleccionado) return;
    setPresionando(true);
    setContador(3);
    setProgreso(0);
    let tiempo = 3;

    intervalRef.current = setInterval(() => {
      tiempo -= 1;
      setContador(tiempo);
      setProgreso((3 - tiempo) / 3 * 100);
    }, 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      const motivoFinal = seleccionado === "Otro" && descripcion.trim()
        ? descripcion.trim()
        : seleccionado;
      onConfirmar(seleccionado, seleccionado === "Otro" ? descripcion.trim() : undefined);
    }, 3000);
  };

  const cancelarPresion = () => {
    if (!presionando) return;
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setPresionando(false);
    setContador(3);
    setProgreso(0);
  };

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="modal-top-area">
          <div className="modal-alarm-icon">📍</div>
          <p className="modal-alarm-label">Incidente marcado en el mapa</p>
        </div>

        <div className="modal-body">
          <h3 className="modal-title">Selecciona el motivo</h3>

          <div className="motivos-grid">
            {MOTIVOS.map(({ key, icono }) => (
              <button
                key={key}
                className={`motivo-btn ${seleccionado === key ? "selected" : ""}`}
                onClick={() => { setSeleccionado(key); cancelarPresion(); }}
              >
                <span className="motivo-icono">{icono}</span>
                <span className="motivo-label">{key}</span>
              </button>
            ))}
            <button
              className={`motivo-btn otro-btn ${seleccionado === "Otro" ? "selected" : ""}`}
              onClick={() => { setSeleccionado("Otro"); cancelarPresion(); }}
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
            className={`confirmar-btn ${!seleccionado ? "disabled" : ""} ${presionando ? "presionando" : ""}`}
            style={presionando ? { background: `linear-gradient(to right, #c0392b ${progreso}%, var(--app-primary) ${progreso}%)` } : {}}
            onMouseDown={iniciarPresion}
            onMouseUp={cancelarPresion}
            onMouseLeave={cancelarPresion}
            onTouchStart={iniciarPresion}
            onTouchEnd={cancelarPresion}
            disabled={!seleccionado}
          >
            {presionando ? `Mantenlo... ${contador}s` : "Mantén presionado 3s para enviar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMapaAlerta;