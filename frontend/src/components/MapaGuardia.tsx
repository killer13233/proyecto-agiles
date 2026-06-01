import { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaGuardia.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ALERT_EMOJI: Record<string, string> = {
  'Robo': '🔫',
  'Arma blanca': '🔪',
  'Acoso': '🙍',
  'Accidente': '💥',
};

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

interface MapaGuardiaProps {
  zonas: Zona[];
  alertas: Alerta[];
  userPosition?: { latitud: number; longitud: number } | null;
  onAlertaClick?: (alerta: Alerta) => void;
  focusedAlerta?: { id: number; latitud: number; longitud: number } | null;
  focusKey?: number;
}

const CAMPUS_CENTER: [number, number] = [-1.269451, -78.623277];

const MapaGuardia = ({ zonas, alertas, userPosition, onAlertaClick, focusedAlerta, focusKey }: MapaGuardiaProps) => {
  const parsePolygon = (poligono: string): [number, number][] => {
    try {
      const parsed = JSON.parse(poligono || '[]');
      const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
      if (Array.isArray(coords)) return coords.map((c: any) => [c[1], c[0]]);
    } catch {}
    return [];
  };

  return (
    <div className="mapa-guardia">
      <MapContainer center={CAMPUS_CENTER} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }}>
        <MapResizer />
        <MapFocusController focusedAlerta={focusedAlerta || null} focusKey={focusKey} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={21}
        />
        {zonas.map(zona => {
          const vertices = parsePolygon(zona.poligono);
          if (vertices.length === 0) return null;
          const color = zona.color || '#2ed573';
          return (
            <Polygon key={zona.id} positions={vertices} pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }}>
              <Popup><div className="mg-popup"><strong>{zona.nombre}</strong><p>{zona.estado || 'Activa'}</p></div></Popup>
            </Polygon>
          );
        })}
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