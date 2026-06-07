
import {
  IonButton,
  IonToggle,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent
} from "@ionic/react";

import { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";

import {
  getAlertas,
  asumirAlerta,
  getZonas
} from "../services/alertasService";

import { wsService } from "../services/wsService";
import { obtenerUbicacion, iniciarSeguimientoGPS } from "../services/gpsService";
import ModalCierre from "../components/ModalCierre";
import MapaGuardia from "../components/MapaGuardia";

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
  guardiasNombres?: string;
  asumidaPorNombre?: string;
  nombreGuardiaAsumio?: string;
  asumidaEn?: string | null;
}

interface TokenData {
  sub?: string;
  nombre?: string;
  zona?: string;
  role?: string;
  rol?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

interface GuardiaProps {
  onIrInicio?: () => void;
}


const ALERT_EMOJI: Record<string, string> = {
  'Robo': '🔫',
  'Arma blanca': '🔪',
  'Acoso': '🙍',
  'Accidente': '💥',
};

const getMotivoEmoji = (motivo: string): string => {
  return ALERT_EMOJI[motivo] || '🚨';
};

const getMiIdActual = (): string => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "";
    const decoded = jwtDecode<TokenData>(token);
    return String(decoded.sub || "");
  } catch {
    return "";
  }
};

const GuardiaScreen: React.FC<GuardiaProps> = ({ onIrInicio }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
   const [ubicacionesUsuarios, setUbicacionesUsuarios] = useState<Record<string, {latitud: number; longitud: number; alertaId: number}>>({});
  const [ubicacionesGuardias, setUbicacionesGuardias] = useState<Record<string, {latitud: number; longitud: number; alertaId: number}>>({});
  const [zonas, setZonas] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<TokenData | null>(null);
  const [miId, setMiId] = useState<string>("");
  const [zonaActual, setZonaActual] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [focusedAlerta, setFocusedAlerta] = useState<Alerta | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [detalleAlerta, setDetalleAlerta] = useState<Alerta | null>(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [userPosition, setUserPosition] = useState<{ latitud: number; longitud: number } | null>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  const rastreoGuardiaRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let cancelado = false;
    const init = async () => {
      const user = await cargarUsuario();
      setUsuario(user);
      await cargarZonas();
      const zActual = await cargarZonaActual();
      setZonaActual(zActual);
      await cargarAlertas();
      await new Promise((r) => setTimeout(r, 150));
      if (!cancelado) {
        wsService.connect();
        registrarEventosWS();
        wsService.send({ tipo: "disponibilidad", disponible: true });
      }
    };
    init();
    return () => {
  cancelado = true;
  if (rastreoGuardiaRef.current) {
    rastreoGuardiaRef.current();
    rastreoGuardiaRef.current = null;
  }
};
  }, []);

  useEffect(() => {
    obtenerUbicacion()
      .then(pos => setUserPosition({ latitud: pos.latitud, longitud: pos.longitud }))
      .catch(() => {});
    const interval = setInterval(() => {
      obtenerUbicacion()
        .then(pos => setUserPosition({ latitud: pos.latitud, longitud: pos.longitud }))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarZonas();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const cargarUsuario = async (): Promise<TokenData | null> => {
    const token = localStorage.getItem("token") || "";
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

  const cargarAlertas = async () => {
    try {
      const [dataActivas, dataAsumidas] = await Promise.all([getAlertas("Activa"), getAlertas("Asumida")]);
      const listaActivas = Array.isArray(dataActivas) ? dataActivas : (dataActivas?.alertas || []);
      const listaAsumidas = Array.isArray(dataAsumidas) ? dataAsumidas : (dataAsumidas?.alertas || []);
      const alertasLista = [...listaActivas, ...listaAsumidas.filter((a: any) => !listaActivas.some((b: any) => b.id === a.id))];
      const alertasFiltradas = alertasLista
        .filter((a: any) => (a.estado || a.Estado) !== "Cerrada")
        .map((a: any) => {
          let guardiasNorm = "[]";
          let nombresNorm = "[]";
          try {
            const raw = a.guardiasInvolucrados;
            if (raw) {
              const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
              if (Array.isArray(parsed)) {
                const ids = parsed.map((g: any) => String(typeof g === "object" ? (g.id ?? g.guardiaId ?? g) : g));
                guardiasNorm = JSON.stringify(ids);
                const noms = parsed.map((g: any) => typeof g === "object" && g.nombre ? g.nombre : null).filter(Boolean);
                nombresNorm = JSON.stringify(noms);
              }
            }
          } catch {}
          return {
            ...a,
            latitud: (a.latitud && a.latitud !== 0) ? a.latitud : -1.269451,
            longitud: (a.longitud && a.longitud !== 0) ? a.longitud : -78.623277,
            guardiasInvolucrados: guardiasNorm,
            guardiasNombres: nombresNorm,
            asumidaPorNombre: a.asumidaPorNombre ?? a.nombreGuardiaAsumio ?? null,
            nombreGuardiaAsumio: a.nombreGuardiaAsumio ?? a.asumidaPorNombre ?? null,
            asumidaEn: a.asumidaEn ?? null,
          };
        });
      setAlertas([...alertasFiltradas].reverse());
    } catch (err) {
      console.error("Error cargando alertas:", err);
      setAlertas([]);
    }
  };

  const registrarEventosWS = () => {
    wsService.on("nueva_alerta", (data) => {
      console.log("🚨 Nueva alerta:", data);
      setAlertas((prev) => {
        if (prev.some((a) => a.id === data.alertaId)) return prev;
        const nuevaAlerta: Alerta = {
          id: data.alertaId, nombreUsuario: data.nombreUsuario, motivo: data.motivo,
          zona: data.zona, estado: "Activa", latitud: data.latitud || -1.269451,
          longitud: data.longitud || -78.623277, guardiasInvolucrados: "[]",
        };
        return [nuevaAlerta, ...prev];
      });
    });
    wsService.on("ubicacion_usuario", (data) => {
  setUbicacionesUsuarios(prev => ({
    ...prev,
    [String(data.usuarioId)]: {
      latitud: data.latitud,
      longitud: data.longitud,
      alertaId: data.alertaId
    }
  }));
});

wsService.on("ubicacion_guardia", (data) => {
  setUbicacionesGuardias(prev => ({
    ...prev,
    [String(data.guardiaId)]: {
      latitud: data.latitud,
      longitud: data.longitud,
      alertaId: data.alertaId
    }
  }));
});

    wsService.on("alerta_asumida", (data) => {
      setAlertas((prev) => prev.map((a) => {
        if (a.id !== data.alertaId) return a;
        let guardias: string[] = [];
        let nombres: string[] = [];
        try { guardias = JSON.parse(a.guardiasInvolucrados || "[]"); } catch {}
        try { nombres = JSON.parse(a.guardiasNombres || "[]"); } catch {}
        if (!guardias.includes(String(data.guardiaId))) {
          guardias = [...guardias, String(data.guardiaId)];
          const nom = data.asumidaPorNombre || data.nombreGuardia;
          if (nom) nombres = [...nombres, nom];
        }
        return {
          ...a, estado: "Asumida",
          guardiasInvolucrados: JSON.stringify(guardias),
          guardiasNombres: JSON.stringify(nombres),
          asumidaPorNombre: data.asumidaPorNombre || data.nombreGuardia || a.asumidaPorNombre,
          nombreGuardiaAsumio: data.nombreGuardia || data.asumidaPorNombre || a.nombreGuardiaAsumio,
          asumidaEn: data.asumidaEn || new Date().toISOString(),
        };
      }));
    });

    wsService.on("alerta_cerrada", (data) => {
      console.log("HANDLER CERRADA EJECUTADO:", data);  
      setAlertas((prev) => prev.filter((a) => a.id !== data.alertaId));
    });
  };

  const handleAsumir = async (alerta: Alerta) => {
    const token = localStorage.getItem("token");
    if (!token) { alert("Sesión expirada"); return; }
    const idActual = miId || getMiIdActual();
    const yaTieneAlerta = alertas.some(a => {
      try {
        return JSON.parse(a.guardiasInvolucrados || "[]").includes(idActual);
      } catch { return false; }
    });
    if (yaTieneAlerta) {
      alert("Ya tienes una alerta asignada. Ciérrala antes de acercarte a otra.");
      return;
    }
    try {
      const decoded = jwtDecode<TokenData>(token);
      const rol = String(
        localStorage.getItem("rol") || decoded.role || decoded.rol ||
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || ""
      ).toLowerCase();
      if (!rol.includes("guardia") && !rol.includes("admin")) {
        alert("Solo las cuentas de Guardia pueden asumir alertas. Inicia sesión con un usuario Guardia.");
        return;
      }
      await asumirAlerta(alerta.id, decoded.sub || "", decoded.nombre || "");
      rastreoGuardiaRef.current = iniciarSeguimientoGPS(
  (pos) => {
    wsService.send({
      tipo: "ubicacion_guardia",
      alertaId: alerta.id,
      latitud: pos.latitud,
      longitud: pos.longitud
    });
  },
  (err) => console.warn("GPS guardia error:", err)
);
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 403) { alert("No tienes permisos para asumir alertas. Usa una cuenta de Guardia."); return; }
      alert("No se pudo asumir la alerta. Intenta nuevamente.");
    }
  };

 const handleCerrar = (alerta: Alerta) => {
  if (rastreoGuardiaRef.current) {
    rastreoGuardiaRef.current();
    rastreoGuardiaRef.current = null;
  }
  setAlertaSeleccionada(alerta);
  setModalVisible(true);
};

  return (
    <div className="mapa-guardia-full">
      <div className="mapa-guardia-toolbar">
        <h3>🗺️ Mapa de Alertas</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "var(--app-text-secondary)", fontSize: "0.8rem" }}>
            {(() => {
              const idActual = miId || getMiIdActual();
              const tieneAlerta = alertas.some(a => {
                if (a.estado === "Cerrada") return false;
                try { return JSON.parse(a.guardiasInvolucrados || "[]").includes(idActual); } catch { return false; }
              });
              if (tieneAlerta) return "🔴 En alerta";
              return disponible ? "🟢 Disponible" : "🔴 No disponible";
            })()}
          </span>
          <IonToggle
            checked={disponible}
            disabled={(() => {
              const idActual = miId || getMiIdActual();
              return alertas.some(a => {
                if (a.estado === "Cerrada") return false;
                try { return JSON.parse(a.guardiasInvolucrados || "[]").includes(idActual); } catch { return false; }
              });
            })()}
            onIonChange={(e) => {
              const nuevoEstado = e.detail.checked;
              setDisponible(nuevoEstado);
              wsService.send({ tipo: "disponibilidad", disponible: nuevoEstado });
            }}
          />
          <IonButton fill="clear" onClick={onIrInicio} style={{ color: "var(--app-text-secondary)" }}>
            ← Perfil
          </IonButton>
        </div>
      </div>
      <div className="mapa-guardia-body" style={{ position: "relative" }}>
      <MapaGuardia
  zonas={zonas}
  alertas={alertas}
  userPosition={userPosition}
  ubicacionesUsuarios={ubicacionesUsuarios}
  ubicacionesGuardias={ubicacionesGuardias}
  focusedAlerta={focusedAlerta}
  focusKey={focusKey}
  onAlertaClick={(alerta) => { setFocusedAlerta(alerta); setFocusKey(k => k + 1); }}
/>
        <div className="alertas-floating-wrapper">
          <button className="afp-toggle" onClick={() => setPanelVisible(v => !v)} title={panelVisible ? "Ocultar panel" : "Mostrar panel"}>
            {panelVisible ? '◀' : '▶'}
          </button>
          {panelVisible && (
          <div className="alertas-floating-panel">
            {alertas.length === 0 ? (
              <div className="afp-empty">No hay alertas activas</div>
            ) : (alertas.map((alerta) => {
            const idActual = miId || getMiIdActual();
            let yoAsumiEsta = false;
            let guardiasNombres: string[] = [];
            try { yoAsumiEsta = JSON.parse(alerta.guardiasInvolucrados || "[]").includes(idActual); } catch {}
            try { guardiasNombres = JSON.parse(alerta.guardiasNombres || "[]"); } catch {}
            const emoji = getMotivoEmoji(alerta.motivo);
            return (
              <div
                key={alerta.id}
                className={`alerta-floating-card ${focusedAlerta?.id === alerta.id ? "selected" : ""}`}
                onClick={() => { setFocusedAlerta(alerta); setFocusKey(k => k + 1); }}
              >
                <div className="afc-header">
                  <span className="afc-motivo">{emoji} {alerta.motivo}</span>
                  <span className={`afc-badge ${alerta.estado === "Activa" ? "badge-activa" : (yoAsumiEsta ? "badge-asumida-yo" : "badge-asumida-otro")}`}>
                    {alerta.estado === "Activa" ? "Activa" : (yoAsumiEsta ? "Asumida por mí" : "Asumida")}
                  </span>
                </div>
                <div className="afc-details">
                  <div className="afc-detail-row">
                    <span className="afc-label">Usuario:</span>
                    <span className="afc-value">{alerta.nombreUsuario}</span>
                  </div>
                  <div className="afc-detail-row">
                    <span className="afc-label">Zona:</span>
                    <span className="afc-value">{alerta.zona}</span>
                  </div>
                  {alerta.estado === "Asumida" && guardiasNombres.length > 0 && (
                    <div className="afc-detail-row afc-guardias">
                      <span className="afc-label">Guardias:</span>
                      <span className="afc-value">
                        {guardiasNombres.map((n, i) => (
                          <span key={i} className="afc-guardia-nombre">
                            👮 {n}{i < guardiasNombres.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
                <div className="afc-actions">
                  <button
                    className="afc-btn afc-btn-detalles"
                    onClick={(e) => { e.stopPropagation(); setDetalleAlerta(alerta); setDetalleVisible(true); }}
                  >
                    Detalles
                  </button>
                  <button
                    className="afc-btn afc-btn-asumir"
                    onClick={(e) => { e.stopPropagation(); handleAsumir(alerta); }}
                    disabled={!disponible || alerta.estado === "Cerrada" || yoAsumiEsta}
                  >
                    {yoAsumiEsta ? "✓ Estoy aquí" : "Me acerco"}
                  </button>
                  <button
                    className="afc-btn afc-btn-cerrar"
                    onClick={(e) => { e.stopPropagation(); handleCerrar(alerta); }}
                    disabled={!yoAsumiEsta}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          }))}
        </div>
        )}
        </div>
      </div>

      <ModalCierre isOpen={modalVisible} alertaId={alertaSeleccionada?.id || 0}
        onClose={() => setModalVisible(false)}
        onCerrada={() => {
          setModalVisible(false);
          if (alertaSeleccionada) {
            setAlertas((prev) => prev.filter((a) => a.id !== alertaSeleccionada.id));
          }
          setAlertaSeleccionada(null);
        }} />

      <IonModal isOpen={detalleVisible} onDidDismiss={() => setDetalleVisible(false)} className="detalle-alerta-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Detalles</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setDetalleVisible(false)}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {detalleAlerta ? (
          <div className="da-container">
            <div className="da-header">
              <span className="da-emoji">{getMotivoEmoji(detalleAlerta.motivo)}</span>
              <div>
                <h2>{detalleAlerta.motivo}</h2>
                {(() => {
                  const idActual = miId || getMiIdActual();
                  let yoAsumiEstaDet = false;
                  try { yoAsumiEstaDet = JSON.parse(detalleAlerta.guardiasInvolucrados || "[]").includes(idActual); } catch {}
                  const esActiva = detalleAlerta.estado === "Activa";
                  return (
                    <span className={`da-badge ${esActiva ? "badge-activa" : (yoAsumiEstaDet ? "badge-asumida-yo" : "badge-asumida-otro")}`}>
                      {esActiva ? "Activa" : (yoAsumiEstaDet ? "Asumida por mí" : "Asumida")}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="da-body">
              <div className="da-row">
                <span className="da-label">Usuario</span>
                <span className="da-value">{detalleAlerta.nombreUsuario}</span>
              </div>
              <div className="da-row">
                <span className="da-label">Zona</span>
                <span className="da-value">{detalleAlerta.zona}</span>
              </div>
              <div className="da-row">
                <span className="da-label">Coordenadas</span>
                <span className="da-value">{Number(detalleAlerta.latitud).toFixed(4)}, {Number(detalleAlerta.longitud).toFixed(4)}</span>
              </div>
              {detalleAlerta.asumidaEn && (
                <div className="da-row">
                  <span className="da-label">Hora</span>
                  <span className="da-value">{new Date(detalleAlerta.asumidaEn).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
              )}
              <div className="da-divider" />
              <div className="da-row">
                <span className="da-label">Cámaras cercanas</span>
                <span className="da-value">
                  {(() => {
                    let camaras: any[] = [];
                    try { camaras = JSON.parse(detalleAlerta.camarasCercanas || "[]"); } catch {}
                    return camaras.length === 0 ? <em>Sin cámaras cercanas</em> : (
                      <ol style={{ margin: 0, paddingLeft: '1rem' }}>
                        {camaras.map((c, i) => (
                          <li key={i} style={{ fontSize: '0.8rem', marginBottom: '0.15rem' }}>
                            {c.nombre} — <em>{c.distanciaMetros.toFixed(1)}m</em>
                          </li>
                        ))}
                      </ol>
                    );
                  })()}
                </span>
              </div>
              <div className="da-divider" />
              <div className="da-row">
                <span className="da-label">Guardias</span>
                <span className="da-value">
                  {(() => {
                    let gn: string[] = [];
                    try { gn = JSON.parse(detalleAlerta.guardiasNombres || "[]"); } catch {}
                    return gn.length === 0 ? <em>Ninguno aún</em> : gn.map((n, i) => (
                      <span key={i}>👮 {n}{i < gn.length - 1 ? ', ' : ''}</span>
                    ));
                  })()}
                </span>
              </div>
            </div>
          </div>
          ) : (
          <div className="da-container"><p style={{color: 'var(--app-text)'}}>Cargando...</p></div>
          )}
        </IonContent>
      </IonModal>
    </div>
  );
};

export default GuardiaScreen;