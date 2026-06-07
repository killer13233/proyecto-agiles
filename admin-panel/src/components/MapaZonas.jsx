import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCamaras, eliminarCamara } from '../services/zonasService';
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
   onCameraClick = null,
   center = [-1.269451, -78.623277],
   zoom = 17,
   bounds = [
     [-1.260, -78.640],  // Suroeste amplio
     [-1.220, -78.600]   // Noreste amplio
   ],
   modoCreacion = false,
    modoCamara = false,
    camaraRefreshKey = 0,
    onCamaraEliminada = null
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
  }, [camaraRefreshKey]);

  // Componente interno para manejar eventos del mapa
  const MapEvents = () => {
    const [tempVertices, setTempVertices] = useState([]);

    useMapEvents({
      click (e) {
        const { lat, lng } = e.latlng;

        if (modoCamara && onCameraClick) {
          onCameraClick(lat, lng);
          return;
        }

        if (modoCreacion) {
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

  const CameraPane = () => {
    const map = useMap();
    useEffect(() => {
      const pane = map.createPane('cameraPane');
      pane.style.zIndex = '650';
    }, [map]);
    return null;
  };

  const handlePolygonClick = (zona) => {
    if (onZonaClick) {
      onZonaClick(zona);
    }
  };

  const handleEliminarCamara = async (camara) => {
    if (!window.confirm(`¿Eliminar cámara "${camara.nombre}"?`)) return;
    const result = await eliminarCamara(camara.id);
    if (result.success) {
      setCamaras(prev => prev.filter(c => c.id !== camara.id));
      if (onCamaraEliminada) onCamaraEliminada(camara.id);
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
      {modoCamara && (
        <div className="modo-creacion-indicator" style={{ background: 'rgba(37, 99, 235, 0.9)' }}>
          <span>📷 Haz click en el mapa dentro de una zona para añadir una cámara</span>
        </div>
      )}
        <MapContainer
          center={center}
          zoom={zoom}
          maxZoom={21}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >

         <CameraPane />
         <MapEvents />
         <TileLayer

          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={21}
        />
        
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
              interactive={!modoCamara}
              pathOptions={{
                color: zona.color || (zona.estado === 'Activa' ? '#10b981' : '#ef4444'),
                fillColor: zona.color || (zona.estado === 'Activa' ? '#10b981' : '#ef4444'),
                fillOpacity: modoCamara ? 0.1 : 0.3,
                weight: modoCamara ? 1 : 2
              }}
              eventHandlers={!modoCamara ? {
                click: () => handlePolygonClick(zona)
              } : {}}
            >
            </Polygon>
          );
        })}
        {camaras.map(camara => (
          <CircleMarker
            key={camara.id}
            center={[camara.latitud, camara.longitud]}
            radius={5}
            pane="cameraPane"
            bubblingMouseEvents={false}
            pathOptions={{ color: '#1a1a2e', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }}
          >
            <Popup>
              <div className="popup-content">
                <h4>{camara.nombre}</h4>
                <p><strong>Facultad:</strong> {camara.facultad}</p>
                <p><strong>Posición:</strong> {camara.posicion}</p>
                <button
                  className="btn btn-eliminar btn-sm"
                  onClick={() => handleEliminarCamara(camara)}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Eliminar cámara
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaZonas;
