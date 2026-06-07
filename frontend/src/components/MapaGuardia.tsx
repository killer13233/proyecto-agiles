import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camara, obtenerCamaras } from '../services/zonasService';
import './MapaGuardia.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// Agregar a las interfaces:
interface UbicacionEnVivo {
  latitud: number;
  longitud: number;
  alertaId: number;
}

interface MapaGuardiaProps {
  zonas: Zona[];
  alertas: Alerta[];
  userPosition?: { latitud: number; longitud: number } | null;
  ubicacionesUsuarios?: Record<string, UbicacionEnVivo>;
  ubicacionesGuardias?: Record<string, UbicacionEnVivo>;
  onAlertaClick?: (alerta: Alerta) => void;
  focusedAlerta?: { id: number; latitud: number; longitud: number } | null;
  focusKey?: number;
}
const ALERT_EMOJI: Record<string, string> = {
  'Robo': '🔫',
  'Arma blanca': '🔪',
  'Acoso': '🙍',
  'Accidente': '💥',
};
// Íconos para rastreo en vivo:
const usuarioVivoIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(239,68,68,0.85);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);animation:pulse 1s infinite;">🆘</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

const guardiaVivoIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(59,130,246,0.85);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);">🚔</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

const getMotivoEmoji = (motivo: string): string => {
  return ALERT_EMOJI[motivo] || '🚨';
};

const getMarkerIcon = (alerta: Alerta) => {
  const borderColor = alerta.estado === 'Activa' ? '#ef4444' : '#f59e0b';
  const emoji = getMotivoEmoji(alerta.motivo);
  return new L.DivIcon({
    className: '',
    html: `<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:30px;background:rgba(10,10,15,0.75);border:3px solid ${borderColor};border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);">${emoji}</div>`,
    iconSize: [56, 56], iconAnchor: [28, 28],
  });
};

const guardMarker = new L.DivIcon({
  className: 'guard-marker',
  html: '<div class="guard-marker-inner">🚔</div>',
  iconSize: [56, 56], iconAnchor: [28, 28],
});

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => { map.invalidateSize(); }, 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

const MapFocusController = ({ focusedAlerta, focusKey }: { focusedAlerta: { id: number; latitud: number; longitud: number } | null; focusKey?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (focusedAlerta && focusedAlerta.latitud != null && focusedAlerta.longitud != null) {
      map.invalidateSize(true);
      map.setView([focusedAlerta.latitud, focusedAlerta.longitud], 21, { animate: true, duration: 0.5 });
    }
  }, [focusKey, focusedAlerta, map]);
  return null;
};

interface Zona { id: number; nombre: string; poligono: string; color?: string; estado?: string; }
interface Alerta { id: number; nombreUsuario: string; motivo: string; zona: string; estado: string; latitud: number; longitud: number; guardiasInvolucrados: string; }



const CAMPUS_CENTER: [number, number] = [-1.269451, -78.623277];

const MapaGuardia = ({ zonas, alertas, userPosition, ubicacionesUsuarios, ubicacionesGuardias, onAlertaClick, focusedAlerta, focusKey }: MapaGuardiaProps) => {
  const [camaras, setCamaras] = useState<Camara[]>([]);

  useEffect(() => {
    const fetch = () => obtenerCamaras().then(setCamaras).catch(console.error);
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  const parsePolygon = (poligono: string): [number, number][] => {
    try {
      const parsed = JSON.parse(poligono || '[]');
      const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
      if (Array.isArray(coords)) return coords.map((c: any) => [c[1], c[0]]);
    } catch {}
    return [];
  };

  const CameraPane = () => {
    const map = useMap();
    useEffect(() => {
      const pane = map.createPane('cameraPane');
      pane.style.zIndex = '650';
    }, [map]);
    return null;
  };

  return (
    <div className="mapa-guardia">
     <MapContainer center={CAMPUS_CENTER} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }}>
  <CameraPane />
  <MapResizer />
  <MapFocusController focusedAlerta={focusedAlerta || null} focusKey={focusKey} />
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    maxNativeZoom={19}
    maxZoom={21}
  />
  {zonas.filter(z => z.estado !== 'Inactiva').map(zona => {
    const vertices = parsePolygon(zona.poligono);
    if (vertices.length === 0) return null;
    const color = zona.color || '#2ed573';
    return (
      <Polygon key={zona.id} positions={vertices} pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }}>
        <Popup><div className="mg-popup"><strong>{zona.nombre}</strong><p>{zona.estado || 'Activa'}</p></div></Popup>
      </Polygon>
    );
  })}
  {camaras.map(camara => (
      <CircleMarker
        key={`c-${camara.id}`}
        center={[camara.latitud, camara.longitud]}
        radius={5}
        pane="cameraPane"
        bubblingMouseEvents={false}
        pathOptions={{ color: '#1a1a2e', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }}
      >
      <Popup>
        <div className="mg-popup">
          <strong>{camara.nombre}</strong>
          <p>{camara.facultad} - {camara.posicion}</p>
        </div>
      </Popup>
    </CircleMarker>
  ))}
  {alertas.filter(a => a.latitud && a.longitud).map(alerta => (
    <Marker
      key={`a-${alerta.id}`}
      position={[alerta.latitud, alerta.longitud]}
      icon={getMarkerIcon(alerta)}
      eventHandlers={onAlertaClick ? { click: () => onAlertaClick(alerta) } : undefined}
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

  {/* Usuarios en tiempo real */}
  {Object.entries(ubicacionesUsuarios || {}).map(([userId, pos]) => (
    <Marker key={`u-live-${userId}`} position={[pos.latitud, pos.longitud]} icon={usuarioVivoIcon}>
      <Popup><strong>🆘 Usuario en peligro</strong><br/>Alerta #{pos.alertaId}</Popup>
    </Marker>
  ))}

  {/* Guardias en tiempo real */}
  {Object.entries(ubicacionesGuardias || {}).map(([guardiaId, pos]) => (
    <Marker key={`g-live-${guardiaId}`} position={[pos.latitud, pos.longitud]} icon={guardiaVivoIcon}>
      <Popup><strong>🚔 Guardia en camino</strong><br/>Alerta #{pos.alertaId}</Popup>
    </Marker>
  ))}

  {userPosition && (
    <>
      <CircleMarker center={[userPosition.latitud, userPosition.longitud]} radius={20} pathOptions={{ color: '#4f8cff', fillColor: '#4f8cff', fillOpacity: 0.15, weight: 1 }} />
      <Marker position={[userPosition.latitud, userPosition.longitud]} icon={guardMarker}><Popup>Tu ubicación</Popup></Marker>
    </>
  )}
</MapContainer>
    </div>
  );
};

export default MapaGuardia;