import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAlertas, asignarAlerta } from '../services/alertasService';
import { getZonas, getCamaras } from '../services/zonasService';
import { getGuardias } from '../services/usuariosService';
import { adminWsService } from '../services/wsService';
import './Alertas.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CAMPUS_CENTER = [-1.269451, -78.623277];

const ALERT_EMOJI = {
  'Robo': '🔫',
  'Arma blanca': '🔪',
  'Acoso': '🙍',
  'Accidente': '💥',
};

const getMotivoEmoji = (motivo) => ALERT_EMOJI[motivo] || '🚨';

const getMarkerIcon = (alerta, seleccionada) => {
  const borderColor = alerta.estado === 'Activa' ? '#ef4444' : alerta.estado === 'Asumida' ? '#f59e0b' : '#6b7280';
  const emoji = getMotivoEmoji(alerta.motivo);
  const size = seleccionada ? 64 : 52;
  const shadow = seleccionada ? '0 0 0 4px rgba(79,140,255,0.5), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.5)';
  return new L.DivIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${seleccionada ? 32 : 26}px;background:rgba(10,10,15,0.80);border:3px solid ${borderColor};border-radius:50%;box-shadow:${shadow};transition:all 0.2s;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MapResizer = ({ resizeKey }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map, resizeKey]);
  return null;
};

const MapFocusController = ({ focusedAlerta, focusKey }) => {
  const map = useMap();
  useEffect(() => {
    if (focusedAlerta && focusedAlerta.latitud != null && focusedAlerta.longitud != null) {
      map.invalidateSize(true);
      map.setView([focusedAlerta.latitud, focusedAlerta.longitud], 21, { animate: true, duration: 0.5 });
    }
  }, [focusKey, focusedAlerta, map]);
  return null;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const raw = dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString) ? dateString : dateString + 'Z';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleString('es-EC', { timeZone: 'America/Guayaquil', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const extraerGuardiasIds = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.filter(id => id && String(id).trim() !== '') : [];
  } catch { return []; }
};

const parseCamarasCercanas = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const parsePolygon = (poligono) => {
  try {
    const parsed = JSON.parse(poligono || '[]');
    const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
    if (Array.isArray(coords)) return coords.map((c) => [c[1], c[0]]);
  } catch {}
  return [];
};

const Alertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [disponibilidadGuardias, setDisponibilidadGuardias] = useState({});
  const coordsVivasRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertaFocusada, setAlertaFocusada] = useState(null);
  const [focusKey, setFocusKey] = useState(0);
  const [resizeKey, setResizeKey] = useState(0);

  const [ubicacionesGuardias, setUbicacionesGuardias] = useState({});

  const [panelVisible, setPanelVisible] = useState(true);

  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [guardiaSeleccionado, setGuardiaSeleccionado] = useState('');

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const [resAlertas, resZonas, resGuardias, resCamaras] = await Promise.all([
        getAlertas({}),
        getZonas(),
        getGuardias(),
        getCamaras(),
      ]);
      if (resAlertas.success) {
        const data = Array.isArray(resAlertas.data) ? resAlertas.data : [];
        setAlertas(data.map(a => {
          const viva = coordsVivasRef.current[Number(a.id)];
          return viva ? { ...a, latitud: viva.lat, longitud: viva.lng } : a;
        }));
      }
      if (resZonas.success) setZonas(Array.isArray(resZonas.data) ? resZonas.data : []);
      if (resGuardias.success) setGuardias(Array.isArray(resGuardias.data) ? resGuardias.data : []);
      if (resCamaras.success) setCamaras(Array.isArray(resCamaras.data) ? resCamaras.data : []);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos(false);
    const interval = setInterval(() => cargarDatos(true), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    adminWsService.on('nueva_alerta', () => cargarDatos(true));
    adminWsService.on('alerta_asumida', () => cargarDatos(true));
    adminWsService.on('alerta_cerrada', () => cargarDatos(true));
    return () => {
      adminWsService.on('nueva_alerta', null);
      adminWsService.on('alerta_asumida', null);
      adminWsService.on('alerta_cerrada', null);
    };
  }, []);
  useEffect(() => {
  adminWsService.on('guardia_disponibilidad', (data) => {
    console.log('[Admin] Disponibilidad recibida:', data);
    setDisponibilidadGuardias(prev => ({ 
      ...prev, 
      [String(data.guardiaId)]: data.disponible 
    }));
  });
  adminWsService.on('ubicacion_guardia', (data) => {
    console.log('[Admin] Ubicación guardia recibida:', data);
    try {
      setUbicacionesGuardias(prev => {
        const next = { ...prev, [String(data.guardiaId)]: { latitud: data.latitud, longitud: data.longitud, alertaId: data.alertaId } };
        window.ubicacionesGuardias = next;
        return next;
      });
    } catch (e) {
      console.error('[Admin] Error en ubicacion_guardia:', e);
    }
  });
  adminWsService.on('ubicacion_usuario', (data) => {
    coordsVivasRef.current[Number(data.alertaId)] = { lat: data.latitud, lng: data.longitud };
    setAlertas(prev => prev.map(a =>
      String(a.id) === String(data.alertaId)
        ? { ...a, latitud: data.latitud, longitud: data.longitud }
        : a
    ));
  });
}, []);


  const alertasFiltradas = alertas.filter(a => a.estado !== 'Cerrada');

  const seleccionarAlerta = (alerta) => {
    setAlertaFocusada(alerta);
    setFocusKey(k => k + 1);
  };

  const idsANombres = (ids) =>
    ids.map(id => {
      const g = guardias.find(gd => String(gd.id) === String(id));
      return g ? g.nombre : `[ID: ${id}]`;
    });

  const handleAsignar = async () => {
    if (!alertaSeleccionada || !guardiaSeleccionado) {
      alert('Por favor, selecciona un guardia válido');
      return;
    }
    const estaOcupado = alertas.some(a => {
      if (a.estado === 'Cerrada') return false;
      const ids = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
      return ids.includes(String(guardiaSeleccionado));
    });
    if (estaOcupado) {
      alert('❌ Este guardia ya está atendiendo una alerta activa.');
      return;
    }
    const g = guardias.find(gd => String(gd.id) === String(guardiaSeleccionado));
    const resultado = await asignarAlerta(alertaSeleccionada.id, guardiaSeleccionado, g?.nombre || 'Guardia');
    if (resultado.success) {
      alert(`✅ Alerta asignada a ${g?.nombre || 'Guardia'}`);
      setModalAsignar(false);
      setGuardiaSeleccionado('');
      setAlertaSeleccionada(null);
      setResizeKey(k => k + 1);
      await cargarDatos(true);
    } else {
      alert('❌ Error al asignar: ' + resultado.error);
    }
  };

  if (loading) {
    return (
      <div className="alertas-mapa-loading">
        <div className="spinner"></div>
        <p>Cargando alertas...</p>
      </div>
    );
  }

  const guardiaVivoIcon = new L.DivIcon({
    className: '',
    html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(59,130,246,0.85);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);">🚔</div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
  return (
    <div className="alertas-mapa-root">

      {/* Mapa fullscreen */}
      <div className="alertas-mapa-container">
        <MapContainer center={CAMPUS_CENTER} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <MapResizer resizeKey={resizeKey} />
          <MapFocusController focusedAlerta={alertaFocusada} focusKey={focusKey} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={21}
          />
          {zonas.filter(z => z.estado !== 'Inactiva').map(zona => {
            const vertices = parsePolygon(zona.poligono);
            if (!vertices.length) return null;
            const color = zona.color || '#2ed573';
            return (
              <Polygon key={zona.id} positions={vertices} pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 2 }}>
                <Popup><strong>{zona.nombre}</strong></Popup>
              </Polygon>
            );
          })}
          {camaras.map(camara => (
            <CircleMarker
              key={`cam-${camara.id}`}
              center={[camara.latitud, camara.longitud]}
              radius={3}
              pathOptions={{ color: '#1a1a2e', weight: 1.5, fillColor: '#ffffff', fillOpacity: 1 }}
            >
              <Popup>
                <div className="popup-content">
                  <strong>{camara.nombre}</strong><br />
                  {camara.facultad} - {camara.posicion}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {alertasFiltradas.filter(a => a.latitud && a.longitud).map(alerta => (
            <Marker
              key={`a-${alerta.id}`}
              position={[alerta.latitud, alerta.longitud]}
              icon={getMarkerIcon(alerta, alertaFocusada?.id === alerta.id)}
              eventHandlers={{ click: () => seleccionarAlerta(alerta) }}
            >
              <Popup>
                <div className="mg-popup">
                  <div className="mg-tipo">{getMotivoEmoji(alerta.motivo)} {alerta.motivo}</div>
                  <p><strong>Usuario:</strong> {alerta.nombreUsuario}</p>
                  <p><strong>Zona:</strong> {alerta.zona}</p>
                  <p><strong>Estado:</strong> {alerta.estado}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {Object.entries(ubicacionesGuardias).map(([guardiaId, pos]) => (
            <Marker key={`g-live-${guardiaId}`} position={[pos.latitud, pos.longitud]} icon={guardiaVivoIcon}>
              <Popup><strong>🚔 Guardia en camino</strong><br/>{pos.alertaId ? `Alerta #${pos.alertaId}` : 'Sin alerta asignada'}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Floating alert cards */}
      {error && <div className="alertas-error-floating">⚠️ {error}</div>}
      <div className="alertas-floating-wrapper">
        <button className="afp-toggle" onClick={() => setPanelVisible(v => !v)} title={panelVisible ? "Ocultar panel" : "Mostrar panel"}>
          {panelVisible ? '▶' : '◀'}
        </button>
        {panelVisible && (
        <div className="alertas-floating-panel">
          {alertasFiltradas.length === 0 ? (
            <div className="afp-empty">No hay alertas activas</div>
          ) : (alertasFiltradas.map(alerta => {
            const guardiasIds = extraerGuardiasIds(alerta.guardiasInvolucrados || alerta.GuardiasInvolucrados);
            const guardiasNombres = idsANombres(guardiasIds);
            const esFocusada = alertaFocusada?.id === alerta.id;

            return (
              <div
                key={alerta.id}
                id={`card-alerta-${alerta.id}`}
                className={`alerta-floating-card ${esFocusada ? 'selected' : ''}`}
                onClick={() => seleccionarAlerta(alerta)}
              >
                <div className="afc-header">
                  <span className="afc-motivo">{getMotivoEmoji(alerta.motivo)} {alerta.motivo || 'Sin motivo'}</span>
                  <span className={`afc-badge ${alerta.estado === 'Activa' ? 'badge-activa' : 'badge-asumida-otro'}`}>
                    {alerta.estado}
                  </span>
                </div>
                <div className="afc-details">
                  <div className="afc-detail-row">
                    <span className="afc-label">Usuario:</span>
                    <span className="afc-value">{alerta.nombreUsuario || 'Desconocido'}</span>
                  </div>
                  <div className="afc-detail-row">
                    <span className="afc-label">Zona:</span>
                    <span className="afc-value">{alerta.zona || 'Sin zona'}</span>
                  </div>
                  {guardiasNombres.length > 0 && (
                    <div className="afc-detail-row">
                      <span className="afc-label">Guardias:</span>
                      <span className="afc-value">
                        {guardiasNombres.map((n, i) => (
                          <span key={i} className="afc-guardia-nombre">👮 {n}{i < guardiasNombres.length - 1 ? ', ' : ''}</span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
                <div className="afc-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="afc-btn afc-btn-detalles"
                    onClick={() => { setAlertaSeleccionada(alerta); setModalDetalles(true); }}
                  >
                    📋 Detalles
                  </button>
                  {alerta.estado === 'Activa' && (
                    <button
                      className="afc-btn afc-btn-asumir"
                      onClick={() => { setAlertaSeleccionada(alerta); setModalAsignar(true); }}
                    >
                      👤 Asignar
                    </button>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
        )}
      </div>

      {/* Modal Asignar */}
      {modalAsignar && alertaSeleccionada && (
        <div className="modal-overlay" onClick={() => { setModalAsignar(false); setResizeKey(k => k + 1); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Alerta</h3>
              <button className="modal-close" onClick={() => { setModalAsignar(false); setResizeKey(k => k + 1); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <h4>{getMotivoEmoji(alertaSeleccionada.motivo)} {alertaSeleccionada.motivo}</h4>
                <p><strong>Zona:</strong> {alertaSeleccionada.zona || 'Sin zona'}</p>
                <p><strong>Reportado por:</strong> {alertaSeleccionada.nombreUsuario || 'Desconocido'}</p>
              </div>
              <div className="guardia-selection">
                <label htmlFor="guardia">Seleccionar guardia:</label>
                <select
                  id="guardia"
                  value={guardiaSeleccionado}
                  onChange={e => setGuardiaSeleccionado(e.target.value)}
                  className="guardia-select"
                >
                  <option value="">-- Seleccionar guardia --</option>
                  {guardias.map(guardia => {
                    const estaOcupado = alertas.some(a => {
                      if (a.estado === 'Cerrada') return false;
                      const ids = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
                      return ids.includes(String(guardia.id));
                    });
                    const estaNoDisponible = disponibilidadGuardias[String(guardia.id)] === false;
                    return (
                      <option key={guardia.id} value={guardia.id} disabled={estaOcupado || estaNoDisponible}>
                        {guardia.nombre} {estaNoDisponible ? '⛔ No disponible' : estaOcupado ? '🔴 Ocupado' : '🟢 Disponible'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => { setModalAsignar(false); setResizeKey(k => k + 1); }}>Cancelar</button>
              <button className="btn btn-confirmar" onClick={handleAsignar}>Confirmar Asignación</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {modalDetalles && alertaSeleccionada && (
        <div className="modal-overlay" onClick={() => { setModalDetalles(false); setResizeKey(k => k + 1); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de Alerta</h3>
              <button className="modal-close" onClick={() => { setModalDetalles(false); setResizeKey(k => k + 1); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="alerta-detalle">
                <p><strong>Motivo:</strong> {getMotivoEmoji(alertaSeleccionada.motivo)} {alertaSeleccionada.motivo}</p>
                <p><strong>Estado:</strong> <span className={`afc-badge ${alertaSeleccionada.estado === 'Activa' ? 'badge-activa' : 'badge-asumida-otro'}`}>{alertaSeleccionada.estado}</span></p>
                <p><strong>Zona:</strong> {alertaSeleccionada.zona || 'Sin zona'}</p>
                <p><strong>Coordenadas:</strong> {alertaSeleccionada.latitud?.toFixed(6)}, {alertaSeleccionada.longitud?.toFixed(6)}</p>
                <p><strong>Reportado por:</strong> {alertaSeleccionada.nombreUsuario}</p>
                <p><strong>Rol:</strong> {alertaSeleccionada.rolUsuario}</p>
                {(() => {
                  const ids = extraerGuardiasIds(alertaSeleccionada.guardiasInvolucrados);
                  const nombres = idsANombres(ids);
                  return nombres.length > 0
                    ? <p><strong>Guardia(s):</strong> {nombres.join(', ')}</p>
                    : null;
                })()}
                <p><strong>Fecha creación:</strong> {formatDate(alertaSeleccionada.creadaEn)}</p>
                {alertaSeleccionada.cerradaEn && <p><strong>Fecha cierre:</strong> {formatDate(alertaSeleccionada.cerradaEn)}</p>}
                {alertaSeleccionada.motivoResolucion && <p><strong>Motivo resolución:</strong> {alertaSeleccionada.motivoResolucion}</p>}
                {alertaSeleccionada.resolucionDescripcion && <p><strong>Resolución:</strong> {alertaSeleccionada.resolucionDescripcion}</p>}
                {(() => {
                  const camaras = parseCamarasCercanas(alertaSeleccionada.camarasCercanas);
                  return camaras.length > 0 ? (
                    <div className="camaras-cercanas">
                      <strong>Cámaras cercanas:</strong>
                      <ol style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
                        {camaras.map((c, i) => (
                          <li key={i}>{c.nombre} — <em>{c.distanciaMetros.toFixed(1)}m</em></li>
                        ))}
                      </ol>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => { setModalDetalles(false); setResizeKey(k => k + 1); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alertas;