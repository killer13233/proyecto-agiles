import { useRef, useState, useEffect } from "react";
import { obtenerUbicacion, iniciarSeguimientoGPS } from "../services/gpsService";
import { wsService } from "../services/wsService";
import { enviarAlerta } from "../services/alertService";
import ModalMotivo, { MotivoEmergencia } from "./ModalMotivo";
import "./ButtonAlarm.css";

const BotonAlarma: React.FC = () => {
  const [estado, setEstado] = useState<"normal" | "presionando" | "enviado" | "gps-error" | "bloqueado">("normal");
  const [contador, setContador] = useState(3);
  const [modalVisible, setModalVisible] = useState(false);
  const [ubicacionTemp, setUbicacionTemp] = useState<{ latitud: number; longitud: number } | null>(null);
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const rastreoRef = useRef<(() => void) | null>(null);
const alertaActivaIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const cerradoId = detail.id ?? detail.Id;
      if (cerradoId === alertaActivaIdRef.current) {
        if (rastreoRef.current) {
          rastreoRef.current();
          rastreoRef.current = null;
        }
        alertaActivaIdRef.current = null;
      }
    };
    window.addEventListener('app-alerta-cerrada', handler);
    return () => window.removeEventListener('app-alerta-cerrada', handler);
  }, []);

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
        setUbicacionTemp(ubicacion);
        setEstado("normal");
        setModalVisible(true);       // ← abre el modal de motivo
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

  const handleConfirmarMotivo = async (
  motivo: MotivoEmergencia,
  descripcion?: string
) => {
  setModalVisible(false);

  if (!ubicacionTemp) return;

  const motivoFinal =
    motivo === "Otro" && descripcion
      ? descripcion
      : motivo;

  try {
    const response = await enviarAlerta(
      ubicacionTemp.latitud,
      ubicacionTemp.longitud,
      motivoFinal
    );

    const alertaId = response?.id || response?.Id;

    setEstado("enviado");

    // ← Iniciar rastreo GPS si tenemos el ID de la alerta
    if (alertaId) {
      alertaActivaIdRef.current = alertaId;

      rastreoRef.current = iniciarSeguimientoGPS(
        (pos) => {
          wsService.send({
            tipo: "ubicacion_usuario",
            alertaId,
            latitud: pos.latitud,
            longitud: pos.longitud,
          });
        },
        (err) => console.warn("GPS error en rastreo:", err)
      );
    }

    setTimeout(() => {
      setEstado("bloqueado");
      setTimeout(() => setEstado("normal"), 60000);
    }, 1500);

  } catch (error) {
    console.error(error);
    setEstado("gps-error");
  }
};

  const handleCancelarModal = () => {
    setModalVisible(false);
    setUbicacionTemp(null);
    setEstado("normal");
  };

  return (
    <>
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
            <>
              <strong>{contador}</strong>
              <span>segundos</span>
            </>
          ) : estado === "enviado" ? (
            <>
              <strong>✓</strong>
              <span>¡ENVIADO!</span>
            </>
          ) : (
            <>
              <strong>🚨</strong>
              <span>ALARMA</span>
            </>
          )}
        </button>

        {estado === "gps-error" && (
          <div className="gps-error-box">
            GPS desactivado. Active la ubicación para enviar la alerta.
          </div>
        )}

        {estado === "bloqueado" && (
          <p className="cooldown-text">Botón disponible en 60 segundos</p>
        )}
      </div>

      <ModalMotivo
        visible={modalVisible}
        onConfirmar={handleConfirmarMotivo}
        onCancelar={handleCancelarModal}
      />
    </>
  );
};

export default BotonAlarma;