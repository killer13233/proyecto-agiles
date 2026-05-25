import { useRef, useState } from "react";
import { obtenerUbicacion } from "../services/gpsService";
import { enviarAlerta } from "../services/alertService";
import ModalMotivo from "./ModalMotivo";
import "./ButtonAlarm.css";

const BotonAlarma: React.FC = () => {
  const [estado, setEstado] = useState<"normal" | "presionando" | "modal" | "enviado" | "gps-error" | "bloqueado">("normal");
  const [contador, setContador] = useState(3);
  const [ubicacionPreparada, setUbicacionPreparada] = useState<{ latitud: number; longitud: number } | null>(null);
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  const iniciarPresion = () => {
    if (estado === "bloqueado") return;
    setEstado("presionando");
    setContador(3);
    let tiempo = 3;

    intervalRef.current = setInterval(() => {
      tiempo -= 1;
      setContador(tiempo);
    }, 1000);

    timerRef.current = setTimeout(async () => {
      clearInterval(intervalRef.current);
      try {
        const ubicacion = await obtenerUbicacion();
        setUbicacionPreparada(ubicacion);
        setEstado("modal"); // ← muestra el modal en lugar de enviar directo
      } catch (error) {
        setEstado("gps-error");
      }
    }, 3000);
  };

  const cancelarPresion = () => {
    if (estado !== "presionando") return;
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setEstado("normal");
    setContador(3);
  };

  const handleConfirmarMotivo = async (motivo: string, descripcion?: string) => {
    if (!ubicacionPreparada) return;
    const motivoFinal = motivo === "Otro" && descripcion ? `Otro: ${descripcion}` : motivo;
    try {
      await enviarAlerta(ubicacionPreparada.latitud, ubicacionPreparada.longitud, motivoFinal);
      setEstado("enviado");
      setTimeout(() => {
        setEstado("bloqueado");
        setTimeout(() => setEstado("normal"), 60000);
      }, 1500);
    } catch {
      setEstado("gps-error");
    }
  };

  const handleCancelarModal = () => {
    setEstado("normal");
    setUbicacionPreparada(null);
  };

  return (
    <div className="alarm-container">
      <p className="alarm-title">
        {estado === "presionando" ? "¡Manténlo presionado!"
          : estado === "enviado" ? "Alerta enviada correctamente"
          : estado === "gps-error" ? "GPS desactivado"
          : "Mantén presionado 3 segundos para activar"}
      </p>

      <button
        className={`alarm-button ${estado === "modal" ? "normal" : estado}`}
        onMouseDown={iniciarPresion}
        onMouseUp={cancelarPresion}
        onMouseLeave={cancelarPresion}
        onTouchStart={iniciarPresion}
        onTouchEnd={cancelarPresion}
      >
        {estado === "presionando" ? (
          <><strong>{contador}</strong><span>segundos</span></>
        ) : estado === "enviado" ? (
          <><strong>✓</strong><span>¡ENVIADO!</span></>
        ) : (
          <><strong>🚨</strong><span>ALARMA</span></>
        )}
      </button>

      {estado === "gps-error" && (
        <div className="gps-error-box">GPS desactivado. Active la ubicación para enviar la alerta.</div>
      )}
      {estado === "bloqueado" && (
        <p className="cooldown-text">Botón disponible en 60 segundos</p>
      )}

      <ModalMotivo
        isOpen={estado === "modal"}
        onConfirmar={handleConfirmarMotivo}
        onCancelar={handleCancelarModal}
      />
    </div>
  );
};

export default BotonAlarma;