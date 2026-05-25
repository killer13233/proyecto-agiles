import { useRef, useState } from "react";
import { obtenerUbicacion } from "../services/gpsService";
import { enviarAlerta } from "../services/alertService";
import ModalMotivo, { Motivo } from "./ModalMotivo";
import "./ButtonAlarm.css";

const BotonAlarma: React.FC = () => {
  const [estado, setEstado] = useState<"normal" | "presionando" | "enviado" | "gps-error" | "bloqueado">("normal");
  const [contador, setContador] = useState(3);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [ubicacionCache, setUbicacionCache] = useState<{ latitud: number; longitud: number } | null>(null);
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
        setUbicacionCache(ubicacion);
        setEstado("normal");
        setMostrarModal(true);
      } catch (error) {
        console.error(error);
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

  const handleConfirmar = async (motivo: Motivo, descripcion: string) => {
    setMostrarModal(false);
    try {
      await enviarAlerta(
        ubicacionCache!.latitud,
        ubicacionCache!.longitud,
        motivo,
        descripcion
      );
      setEstado("enviado");
      setTimeout(() => {
        setEstado("bloqueado");
        setTimeout(() => setEstado("normal"), 60000);
      }, 1500);
    } catch (error) {
      console.error(error);
      setEstado("gps-error");
    }
  };

  const handleCancelar = () => {
    setMostrarModal(false);
    setEstado("normal");
  };

  return (
    <div className="alarm-container">
      <p className="alarm-title">
        {estado === "presionando"
          ? "¡Manténlo presionado!"
          : estado === "enviado"
          ? "Alerta enviada correctamente"
          : estado === "gps-error"
          ? "GPS desactivado"
          : "Mantén presionado 3 segundos para activar"}
      </p>
      <button
        className={`alarm-button ${estado}`}
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
        visible={mostrarModal}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
      />
    </div>
  );
};

export default BotonAlarma;