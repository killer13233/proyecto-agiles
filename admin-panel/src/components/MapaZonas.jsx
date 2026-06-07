import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCamaras } from '../services/zonasService';
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
   center = [-1.269451, -78.623277],
    zoom = 18,
   bounds = [
     [-1.260, -78.640],  // Suroeste amplio
     [-1.220, -78.600]   // Noreste amplio
   ],
   modoCreacion = false  // Nuevo prop para modo de creación
 }) => {


  const [mapReady, setMapReady] = useState(false);
  const [camaras, setCamaras] = useState([]);
  const mapRef = useRef();

  useEffect(() => {
    const fetchCamaras = async () => {
      const result = await getCamaras();
      if (result.success) {
        setCamaras(result.data);
      }
    };
    fetchCamaras();
  }, []);

  // Componente interno para manejar eventos del mapa
  const MapEvents = () => {
    const [tempVertices, setTempVertices] = useState([]);

    useMapEvents({
      click (e) {
        if (modoCreacion) {
          const { lat, lng } = e.latlng;
          
          setTempVertices(prev => {
            const newVertices = [...prev, [lng, lat]];
            
            // Si tenemos al menos 3 puntos y el usuario hace click cerca del primero, cerramos el polígono
            if (prev.length >= 3) {
              const firstPoint = prev[0];
              const dist = Math.sqrt(Math.pow(lng - firstPoint[0], 2) + Math.pow(lat - firstPoint[1], 2));
              
              if (dist < 0.001) { // Umbral de cercanía para cerrar
                const finalPolygon = [...newVertices, firstPoint];
                if (onMapClick) {
                  onMapClick(finalPolygon);
                }
                setTempVertices([]);
                return [];
              }
            }
            return newVertices;
          });
        }
      },
    });

    return (
      <>
        {tempVertices.length > 0 && (
          <Polyline 
            positions={tempVertices.map(v => [v[1], v[0]])} 
            color="blue" 
            dashArray="5, 10" 
          />
        )}
        {tempVertices.map((v, i) => (
          <Marker key={i} position={[v[1], v[0]]} />
        ))}
      </>
    );
  };

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
          <span>📍 Haz click en el mapa para marcar los vértices. Haz click en el primer punto para cerrar la zona.</span>
        </div>
      )}
        <MapContainer
          center={center}
          zoom={zoom}
          maxZoom={21}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >

         <MapEvents />
         <TileLayer

          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={21}
        />
        
        {camaras.map(camara => (
          <CircleMarker
            key={camara.id}
            center={[camara.latitud, camara.longitud]}
            radius={3}
            pathOptions={{ color: '#1a1a2e', weight: 1.5, fillColor: '#ffffff', fillOpacity: 1 }}
          >
            <Popup>
              <div className="popup-content">
                <h4>{camara.nombre}</h4>
                <p><strong>Facultad:</strong> {camara.facultad}</p>
                <p><strong>Posición:</strong> {camara.posicion}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {zonas.map(zona => {
          // Convertir GeoJSON [lon, lat] a formato Leaflet [lat, lon]
          let vertices = [];
        try {
          const parsed = JSON.parse(zona.poligono || '[]');
          // Manejar formato GeoJSON {"type": "Polygon", "coordinates": [[...]]} 
          // o formato arreglo simple [[...]]
          const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
          
          if (Array.isArray(coords)) {
            vertices = coords.map(coord => [coord[1], coord[0]]);
          }
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
