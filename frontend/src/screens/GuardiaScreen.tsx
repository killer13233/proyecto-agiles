import {
  IonPage, IonContent, IonModal, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonToggle
} from "@ionic/react";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Preferences } from "@capacitor/preferences";
import { getAlertas, asumirAlerta, getZonas } from "../services/alertasService";
import { wsService } from "../services/wsService";
import { obtenerUbicacion } from "../services/gpsService";
import ModalCierre from "../components/ModalCierre";
import MapaAlerta from "../components/MapaAlerta";
import "./GuardiaScreen.css";

interface Alerta {
  id: number;
  nombreUsuario: string;
  motivo: string;
  zona: string;
  estado: string;
  latitud: number;
  longitud: number;
  guardiasInvolucrados: string;
}

interface TokenData {
  sub?: string;
  nombre?: string;
  zona?: string;
}

interface GuardiaProps {
  onIrInicio?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Helper: calcula estilo desde la perspectiva del guardia actual
// ─────────────────────────────────────────────────────────────
const getAlertaEstiloPersonal = (alerta: Alerta, miId: string) => {
  if (alerta.estado === "Activa") {
    return {
      cardClass: "alerta-card",
      badgeClass: "badge-activa",
      badgeTexto: "Activa",
      colorBorde: "#ef4444",
    };
  }

  try {
    const guardias: string[] = JSON.parse(alerta.guardiasInvolucrados || "[]");
    const yoAsumiEsta = guardias.includes(miId);

    if (yoAsumiEsta) {
      // Amarillo: YO la asumí
      return {
        cardClass: "alerta-card asumida-yo",
        badgeClass: "badge-asumida-yo",
        badgeTexto: `✅ Asumida por mí${guardias.length > 1 ? ` +${guardias.length - 1}` : ""}`,
        colorBorde: "#f59e0b",
      };
    } else {
      // Azul: OTRO guardia la asumió, yo no
      return {
        cardClass: "alerta-card asumida-otro",
        badgeClass: "badge-asumida-otro",
        badgeTexto: `👮 Asumida (${guardias.length} guardia${guardias.length > 1 ? "s" : ""})`,
        colorBorde: "#3b82f6",
      };
    }
  } catch {
    return {
      cardClass: "alerta-card asumida-otro",
      badgeClass: "badge-asumida-otro",
      badgeTexto: "Asumida",
      colorBorde: "#3b82f6",
    };
  }
};

// Lee el ID del guardia actual directo del token (nunca falla por timing de estado)
const getMiIdActual = (): string => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const decoded = jwtDecode<TokenData>(token);
    return String(decoded.sub || '');
  } catch { return ''; }
};

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const GuardiaScreen: React.FC<GuardiaProps> = ({ onIrInicio }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<TokenData | null>(null);
  const [miId, setMiId] = useState<string>(""); // ← ID del guardia actual
  const [zonaActual, setZonaActual] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMapaVisible, setModalMapaVisible] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);

 useEffect(() => {
    let cancelado = false;

    const init = async () => {
      const user = await cargarUsuario();
      setUsuario(user);
      await cargarZonas();
      const zActual = await cargarZonaActual();
      setZonaActual(zActual);
      await cargarAlertas(user, zActual);

      await new Promise((r) => setTimeout(r, 150));

      if (!cancelado) {
        await wsService.connect();
        registrarEventosWS();
        wsService.send({ tipo: "disponibilidad", disponible: true });
      }
    };

    init();

    return () => {
      cancelado = true;
      wsService.disconnect();
    };
  }, []);

  // ─── Carga usuario y setea miId ───────────────────────────
  const cargarUsuario = async (): Promise<TokenData | null> => {
    const tokenLocal = localStorage.getItem("token") || "";
    const tokenPref = (await Preferences.get({ key: "token" })).value || "";
    const token = tokenLocal || tokenPref;

    if (token) {
      const decoded = jwtDecode<TokenData>(token);
      setMiId(decoded.sub || "");
      return decoded;
    }
    return null;
  };

  const cargarZonaActual = async (): Promise<string | null> => {
    try {
      const pos = await obtenerUbicacion();
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8090";
      const res = await fetch(`${API_BASE}/api/zonas/punto?lat=${pos.latitud}&lon=${pos.longitud}`);
      if (res.ok) {
        const data = await res.json();
        return data.zona || null;
      }
    } catch (err) {
      console.error("Error obteniendo zona actual:", err);
    }
    return null;
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

  const cargarAlertas = async (usuario: TokenData | null, zonaActual: string | null) => {
    try {
     const [dataActivas, dataAsumidas] = await Promise.all([
  getAlertas("Activa"),
  getAlertas("Asumida")
]);

const listaActivas = Array.isArray(dataActivas) ? dataActivas : (dataActivas?.alertas || []);
const listaAsumidas = Array.isArray(dataAsumidas) ? dataAsumidas : (dataAsumidas?.alertas || []);

const alertasLista = [
  ...listaActivas,
  ...listaAsumidas.filter((a: any) => !listaActivas.some((b: any) => b.id === a.id))
];

      const alertasFiltradas = alertasLista
        .filter((a: any) => (a.estado || a.Estado) !== "Cerrada")
        .map((a: any) => {
          let guardiasNorm = '[]';
          try {
            const raw = a.guardiasInvolucrados;
            if (raw) {
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (Array.isArray(parsed)) {
                const ids = parsed.map((g: any) =>
                  typeof g === 'object' ? String(g.id ?? g.guardiaId ?? g) : String(g)
                );
                guardiasNorm = JSON.stringify(ids);
              }
            }
          } catch { guardiasNorm = '[]'; }
          return { ...a, guardiasInvolucrados: guardiasNorm };
        });

      const alertasOrdenadas = [...alertasFiltradas].sort((a: any, b: any) => {
        const fechaA = new Date(a.creadaEn || a.CreadaEn || 0).getTime();
        const fechaB = new Date(b.creadaEn || b.CreadaEn || 0).getTime();

        if (fechaA !== fechaB) return fechaB - fechaA;

        if ((a.estado || a.Estado) === "Asumida" && (b.estado || b.Estado) !== "Asumida") return -1;
        if ((b.estado || b.Estado) === "Asumida" && (a.estado || a.Estado) !== "Asumida") return 1;

        return String(a.id || a.Id).localeCompare(String(b.id || b.Id));
      });

      setAlertas(alertasOrdenadas);
    } catch (err) {
      console.error("Error cargando alertas:", err);
      setAlertas([]);
    }
  };

  const registrarEventosWS = () => {
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
          guardiasInvolucrados: "[]",
        }];
      });
    });

    wsService.on("alerta_asumida", (data) => {
      // El backend manda guardiaId (ej. "4"), no un array completo.
      // Acumulamos en el array existente sin duplicar.
      setAlertas((prev) =>
        prev.map((a) => {
          if (a.id !== data.alertaId) return a;

          let guardias: string[] = [];
          try { guardias = JSON.parse(a.guardiasInvolucrados || "[]"); } catch {}

          const guardiaIdStr = String(data.guardiaId);
          if (!guardias.includes(guardiaIdStr)) {
            guardias = [...guardias, guardiaIdStr];
          }

          return {
            ...a,
            estado: "Asumida",
            guardiasInvolucrados: JSON.stringify(guardias),
          };
        })
      );
    });

    wsService.on("alerta_cerrada", (data) => {
      setAlertas((prev) => prev.filter((a) => a.id !== data.alertaId));
    });
  };

  const handleVerDetalles = (alerta: Alerta) => {
    setAlertaSeleccionada(alerta);
    setModalMapaVisible(true);
  };

  const handleAsumir = async (alerta: Alerta) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Error: Sesión no encontrada. Por favor, inicie sesión nuevamente.");
      return;
    }
    try {
      const decoded = jwtDecode<TokenData>(token);
      await asumirAlerta(alerta.id, decoded.sub || "", decoded.nombre || "");
    } catch (err) {
      console.error("Error al asumir alerta:", err);
      alert("Hubo un error al intentar asumir la alerta.");
    }
  };

  const handleCerrar = (alerta: Alerta) => {
    setAlertaSeleccionada(alerta);
    setModalVisible(true);
  };

  return (
    <IonPage>
      <IonContent className="profile-bg">
        <div className="profile-phone">
          <div className="guardia-header">
            <h2>Alertas Activas</h2>
            <div className="status-container">
              <span className="status-label">Estado: </span>
              <span style={{ fontWeight: "bold", color: disponible ? "#10b981" : "#ef4444" }}>
                {disponible ? "Disponible" : "No disponible"}
              </span>
            <IonToggle
  checked={disponible}
  onIonChange={(e) => {
    const nuevoEstado = e.detail.checked;
    setDisponible(nuevoEstado);
      console.log('Enviando disponibilidad:', nuevoEstado, 'socket state:', (wsService as any).socket?.readyState);
    wsService.send({ tipo: "disponibilidad", disponible: nuevoEstado });
  }}
  style={{ marginLeft: "10px" }}
/>
            </div>
            <IonButton
              fill="clear"
              onClick={onIrInicio}
              style={{ fontSize: "0.8rem", color: "#666", marginBottom: "15px" }}
            >
              ← Volver al perfil
            </IonButton>
          </div>

          {alertas.length === 0 && (
            <p style={{ textAlign: "center", marginTop: 40, color: "#999" }}>
              No hay alertas activas
            </p>
          )}

          <div className="alertas-list">
            {(() => {
              // Calcular FUERA del map si ya tengo alguna alerta asumida
              const idActual = miId || getMiIdActual();
              const yaRespiendo = alertas.some((a) => {
                try {
                  const g: string[] = JSON.parse(a.guardiasInvolucrados || '[]');
                  return g.includes(idActual);
                } catch { return false; }
              });

              return alertas.map((alerta) => {
              // Leer ID desde token directamente para evitar problemas de timing con el estado
              const idActual = miId || getMiIdActual();
              const estilo = getAlertaEstiloPersonal(alerta, idActual);
              let yoAsumiEsta = false;
              try {
                const guardias: string[] = JSON.parse(alerta.guardiasInvolucrados || "[]");
                yoAsumiEsta = guardias.includes(idActual);
                console.log("[DEBUG] alerta", alerta.id, "guardias:", guardias, "idActual:", idActual, "yoAsumiEsta:", yoAsumiEsta);
              } catch {}

              return (
                <div
                  key={alerta.id}
                  className={estilo.cardClass}
                  style={{ borderLeft: `5px solid ${estilo.colorBorde}` }}
                >
                  <div className="alerta-header">
                    <span className="alerta-title">🚨 {alerta.motivo}</span>
                    <span className={`alerta-badge ${estilo.badgeClass}`}>
                      {estilo.badgeTexto}
                    </span>
                  </div>

                  <div className="alerta-info">
                    <div>
                      <span>Usuario:</span>
                      <b>{alerta.nombreUsuario}</b>
                    </div>
                    <div>
                      <span>Zona:</span>
                      <b>{alerta.zona}</b>
                    </div>
                  </div>

                  <div className="alerta-actions">
                    <button
                      className="action-btn"
                      style={{ backgroundColor: "#3b82f6", color: "white" }}
                      onClick={() => handleVerDetalles(alerta)}
                    >
                      Detalles
                    </button>

                    <button
                      className="action-btn btn-asumir"
                      onClick={() => handleAsumir(alerta)}
                      disabled={!disponible || alerta.estado === "Cerrada" || (yaRespiendo && !yoAsumiEsta)}
                      title={
                        yoAsumiEsta ? "Ya te uniste a esta alerta"
                        : yaRespiendo ? "Ya tienes una alerta activa, ciérrala primero"
                        : "Unirme a esta alerta"
                      }
                    >
                      {yoAsumiEsta ? "✓ Me uní" : "Me acerco"}
                    </button>

                    <button
                      className="action-btn btn-cerrar"
                      onClick={() => handleCerrar(alerta)}
                      disabled={!yoAsumiEsta}
                      title={!yoAsumiEsta ? "Debes asumir la alerta antes de cerrarla" : "Cerrar caso"}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              );
            });
            })()}
          </div>

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
            <IonContent className="ion-padding">
              {alertaSeleccionada && (
                <MapaAlerta
                  lat={alertaSeleccionada.latitud}
                  lng={alertaSeleccionada.longitud}
                  motivo={alertaSeleccionada.motivo}
                  estado={alertaSeleccionada.estado}
                  height="60vh"
                  zonas={zonas}
                />
              )}
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p><strong>Alerta:</strong> {alertaSeleccionada?.motivo}</p>
                <p><strong>Zona:</strong> {alertaSeleccionada?.zona}</p>
              </div>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuardiaScreen;