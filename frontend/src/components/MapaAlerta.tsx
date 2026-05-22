import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet que no cargan por defecto en Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Definición de iconos personalizados por color según estado
const getCustomIcon = (estado: string) => {
  let color = 'blue'; // default
  if (estado === 'Activa') color = 'red';
  else if (estado === 'Asumida') color = 'orange';
  else if (estado === 'Cerrada') color = 'gray';

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

interface Zona {
  id: number;
  nombre: string;
  poligono: string;
  coordenadas?: { latitud: number; longitud: number }[];
}

interface MapaAlertaProps {
  lat: number;
  lng: number;
  motivo: string;
  estado: string;
  height?: string;
  zonas?: Zona[];
}

const ZONA_COLORS: Record<string, string> = {
  'Zona A': 'blue',
  'Zona B': 'green',
  'Zona C': 'red',
  'Zona D': 'orange',
  'default': 'purple'
};

// Componente para forzar el renderizado correcto del mapa en modales
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 16);
    }, 300);
    return () => clearTimeout(timer);
  }, [map, center]);
  return null;
};

const MapaAlerta: React.FC<MapaAlertaProps> = ({ lat, lng, motivo, estado, height = '300px', zonas = [] }) => {
  const safeLat = lat || -1.269451;
  const safeLng = lng || -78.623277;

  return (
    <div style={{ height: height, width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
      <MapContainer 
        center={[safeLat, safeLng]} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
      >
        <MapController center={[safeLat, safeLng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {zonas && zonas.map(zona => {
          let vertices: [number, number][] = [];
          try {
            const parsed = JSON.parse(zona.poligono || '[]');
            const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
            
            if (Array.isArray(coords)) {
              vertices = coords.map((coord: any) => [coord[1], coord[0]]);
            }
          } catch (e) {
            console.error(`Error parsing polygon for ${zona.nombre}:`, e);
            return null;
          }

          if (vertices.length === 0) return null;

          return (
            <Polygon 
              key={zona.id} 
              positions={vertices}
              pathOptions={{ 
                color: ZONA_COLORS[zona.nombre] || ZONA_COLORS.default, 
                fillColor: ZONA_COLORS[zona.nombre] || ZONA_COLORS.default,
                fillOpacity: 0.4 
              }}
            >
              <Popup>{zona.nombre}</Popup>
            </Polygon>
          );
        })}

        <Marker position={[safeLat, safeLng]} icon={getCustomIcon(estado)}>
          <Popup>
            <strong>Alerta: {motivo}</strong> <br />
            Estado: {estado}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapaAlerta;
