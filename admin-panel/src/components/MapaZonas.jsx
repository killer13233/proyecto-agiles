import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaZonas.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapaZonas = ({ 
  zonas = [], 
  zonaSeleccionada = null, 
  onZonaClick = null,
  onMapClick = null,
  center = [-1.2687, -78.62434],
  zoom = 18,
  bounds = [
    [-1.272, -78.628],  // Suroeste del campus UTA
    [-1.265, -78.620]   // Noreste del campus UTA
  ],
  modoCreacion = false  // Nuevo prop para modo de creación
}) => {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handlePolygonClick = (zona) => {
    if (onZonaClick) {
      onZonaClick(zona);
    }
  };

  const handleMapClick = (e) => {
    if (modoCreacion) {
      const { lat, lng } = e.latlng;
      if (onMapClick) {
        onMapClick({ latitud: lat, longitud: lng });
      }
    } else if (onZonaClick) {
      const { lat, lng } = e.latlng;
      onMapClick({ latitud: lat, longitud: lng });
    }
  };

  if (!mapReady) {
    return (
      <div className="mapa-loading">
        <div className="spinner"></div>
        <p>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="mapa-container">
      {modoCreacion && (
        <div className="modo-creacion-indicator">
          <span>📍 Haz click en el mapa para crear una zona</span>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        onClick={handleMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {zonas.map(zona => {
          // Convertir GeoJSON [lon, lat] a formato Leaflet [lat, lon]
          let vertices = [];
          try {
            const coords = JSON.parse(zona.poligono || '[]');
            vertices = coords.map(coord => [coord[1], coord[0]]);
          } catch (e) {
            console.error('Error parsing polygon:', e);
            return null;
          }

          if (vertices.length === 0) return null;

          return (
            <Polygon
              key={zona.id}
              positions={vertices}
              pathOptions={{
                color: zona.color || (zona.estado === 'Activa' ? '#10b981' : '#ef4444'),
                fillColor: zona.color || (zona.estado === 'Activa' ? '#10b981' : '#ef4444'),
                fillOpacity: 0.3,
                weight: 2
              }}
              eventHandlers={{
                click: () => handlePolygonClick(zona)
              }}
            >
              <Popup>
                <div className="popup-content">
                  <h4>{zona.nombre}</h4>
                  <p><strong>Estado:</strong> {zona.estado || 'Activa'}</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapaZonas;
