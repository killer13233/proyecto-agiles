import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardContent, IonText, IonSpinner, IonBadge } from '@ionic/react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaScreen.css';
import { obtenerUbicacion, iniciarSeguimientoGPS, PositionData } from '../services/gpsService';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Zona {
  id: number;
  nombre: string;
  poligono: string;
  color?: string;
}

const ZONA_COLORS: Record<string, string> = {
  'Zona A': '#3b82f6',
  'Zona B': '#22c55e',
  'Zona C': '#ef4444',
  'Zona D': '#f97316',
  'default': '#8b5cf6'
};

// Coordenadas del campus UTA Huachi
const CAMPUS_CENTER: [number, number] = [-1.269451, -78.623277];
const CAMPUS_ZOOM = 16;

// Zonas del campus UTA (polígonos de ejemplo - deben ajustarse a las reales)
const ZONAS_CAMPUS: Zona[] = [
  {
    id: 1,
    nombre: 'Zona A',
    poligono: JSON.stringify({
      coordinates: [[
        [-78.624, -1.268],
        [-78.623, -1.268],
        [-78.623, -1.269],
        [-78.624, -1.269],
        [-78.624, -1.268]
      ]]
    }),
    color: ZONA_COLORS['Zona A']
  },
  {
    id: 2,
    nombre: 'Zona B',
    poligono: JSON.stringify({
      coordinates: [[
        [-78.623, -1.269],
        [-78.622, -1.269],
        [-78.622, -1.270],
        [-78.623, -1.270],
        [-78.623, -1.269]
      ]]
    }),
    color: ZONA_COLORS['Zona B']
  },
  {
    id: 3,
    nombre: 'Zona C',
    poligono: JSON.stringify({
      coordinates: [[
        [-78.624, -1.270],
        [-78.623, -1.270],
        [-78.623, -1.271],
        [-78.624, -1.271],
        [-78.624, -1.270]
      ]]
    }),
    color: ZONA_COLORS['Zona C']
  },
  {
    id: 4,
    nombre: 'Zona D',
    poligono: JSON.stringify({
      coordinates: [[
        [-78.622, -1.270],
        [-78.621, -1.270],
        [-78.621, -1.271],
        [-78.622, -1.271],
        [-78.622, -1.270]
      ]]
    }),
    color: ZONA_COLORS['Zona D']
  }
];

// Componente para controlar el mapa
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, zoom);
    }, 300);
    return () => clearTimeout(timer);
  }, [map, center, zoom]);
  return null;
};

const MapaScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [zonas, setZonas] = useState<Zona[]>(ZONAS_CAMPUS);
  const [mapReady, setMapReady] = useState(false);
  const [userPosition, setUserPosition] = useState<PositionData | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de zonas desde el backend
    const timer = setTimeout(() => {
      setLoading(false);
      setMapReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    // Obtener posición inicial
    obtenerUbicacion()
      .then((position) => {
        setUserPosition(position);
        setGpsError(null);
      })
      .catch((error) => {
        console.error('Error obteniendo ubicación:', error);
        setGpsError(error.message);
      });

    // Iniciar seguimiento GPS cada 5 segundos
    const cleanup = iniciarSeguimientoGPS(
      (position) => {
        setUserPosition(position);
        setGpsError(null);
      },
      (error) => {
        console.error('Error en seguimiento GPS:', error);
        setGpsError(error.message);
      }
    );

    return cleanup;
  }, [mapReady]);

  const parsePolygon = (poligono: string): [number, number][] => {
    try {
      const parsed = JSON.parse(poligono || '[]');
      const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
      
      if (Array.isArray(coords)) {
        return coords.map((coord: any) => [coord[1], coord[0]]);
      }
    } catch (e) {
      console.error('Error parsing polygon:', e);
    }
    return [];
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Mapa del Campus UTA</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Cargando mapa...</IonText>
          </div>
        ) : (
          <div className="map-container">
            <MapContainer 
              center={CAMPUS_CENTER} 
              zoom={CAMPUS_ZOOM}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {zonas.map(zona => {
                const vertices = parsePolygon(zona.poligono);
                if (vertices.length === 0) return null;

                return (
                  <Polygon 
                    key={zona.id} 
                    positions={vertices}
                    pathOptions={{ 
                      color: zona.color || ZONA_COLORS.default,
                      fillColor: zona.color || ZONA_COLORS.default,
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                  >
                    <Popup>{zona.nombre}</Popup>
                  </Polygon>
                );
              })}

              {/* Marcador de posición GPS del usuario */}
              {userPosition && (
                <>
                  {/* Círculo de precisión GPS */}
                  <CircleMarker
                    center={[userPosition.latitud, userPosition.longitud]}
                    radius={userPosition.precision || 20}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.15,
                      weight: 1
                    }}
                  />
                  {/* Pin de posición del usuario */}
                  <Marker position={[userPosition.latitud, userPosition.longitud]}>
                    <Popup>
                      <strong>Tu ubicación</strong><br />
                      Lat: {userPosition.latitud.toFixed(6)}<br />
                      Lng: {userPosition.longitud.toFixed(6)}<br />
                      Precisión: {userPosition.precision ? Math.round(userPosition.precision) + 'm' : 'N/A'}
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>

            <IonCard className="info-card">
              <IonCardContent>
                <IonText>
                  <p><strong>Mapa del Campus UTA Huachi</strong></p>
                  <p className="info-text">Las 4 zonas del campus están delimitadas en el mapa.</p>
                  <p className="info-text">Toca el mapa para registrar tu ubicación.</p>
                  {gpsError && (
                    <p className="error-text">
                      <IonBadge color="danger">GPS Error</IonBadge> {gpsError}
                    </p>
                  )}
                  {userPosition && !gpsError && (
                    <p className="success-text">
                      <IonBadge color="success">GPS Activo</IonBadge> Posición actualizada
                    </p>
                  )}
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MapaScreen;
