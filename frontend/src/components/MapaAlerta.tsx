import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaAlerta.css';

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

const getCustomIcon = (motivo: string, estado: string) => {
  const borderColor = estado === 'Activa' ? '#ef4444' : estado === 'Asumida' ? '#f59e0b' : '#6b7280';
  const emoji = getMotivoEmoji(motivo);
  return new L.DivIcon({
    className: '',
    html: `<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:30px;background:rgba(10,10,15,0.75);border:3px solid ${borderColor};border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);">${emoji}</div>`,
    iconSize: [56, 56], iconAnchor: [28, 28],
  });
};

interface Zona { id: number; nombre: string; poligono: string; }
interface MapaAlertaProps { lat: number; lng: number; motivo: string; estado: string; height?: string; zonas?: Zona[]; }

const ZONA_COLORS: Record<string, string> = { 'Zona A': 'blue', 'Zona B': 'green', 'Zona C': 'red', 'Zona D': 'orange', default: 'purple' };

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const initialized = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        map.invalidateSize(true);
        if (!initialized.current) {
          map.setView(center, 21, { animate: false });
          initialized.current = true;
        }
      } catch (e) {
        console.error('[MapaAlerta] Error:', e);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const MapaAlerta: React.FC<MapaAlertaProps> = ({ lat, lng, motivo, estado, height = '300px', zonas = [] }) => {
  const safeLat = lat || -1.269451;
  const safeLng = lng || -78.623277;
  const isFull = height === '100%';
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isFull) {
      const t = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(t);
    }
    setShow(true);
  }, [isFull]);

  const polygons = zonas?.map(zona => {
    let vertices: [number, number][] = [];
    try {
      const parsed = JSON.parse(zona.poligono || '[]');
      const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
      if (Array.isArray(coords)) vertices = coords.map((c: any) => [c[1], c[0]]);
    } catch { return null; }
    if (vertices.length === 0) return null;
    return (
      <Polygon key={zona.id} positions={vertices}
        pathOptions={{ color: ZONA_COLORS[zona.nombre] || ZONA_COLORS.default, fillColor: ZONA_COLORS[zona.nombre] || ZONA_COLORS.default, fillOpacity: 0.25 }}>
        <Popup>{zona.nombre}</Popup>
      </Polygon>
    );
  });

  const marker = (
    <Marker position={[safeLat, safeLng]} icon={getCustomIcon(motivo, estado)}>
      <Popup><strong>🚨 {motivo}</strong><br />Estado: {estado}</Popup>
    </Marker>
  );

  const mapElem = (
    <MapContainer center={[safeLat, safeLng]} zoom={21} maxZoom={21} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <MapController center={[safeLat, safeLng]} />
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} maxZoom={21} />
      {polygons}
      {marker}
    </MapContainer>
  );

  if (!show) return <div className="mapa-alerta-fullscreen"><div className="map-loading">Cargando mapa...</div></div>;

  if (isFull) return <div className="mapa-alerta-fullscreen">{mapElem}</div>;

  return <div style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }}>{mapElem}</div>;
};

export default MapaAlerta;