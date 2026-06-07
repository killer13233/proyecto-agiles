import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardContent, IonText, IonSpinner, IonBadge, IonButton, IonModal, IonAlert } from '@ionic/react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaScreen.css';
import { obtenerUbicacion, iniciarSeguimientoGPS, PositionData } from '../services/gpsService';
import { validarPuntoEnCampus, obtenerZonas, Zona as ZonaBackend } from '../services/zonasService';
import { Preferences } from '@capacitor/preferences';
import { enviarAlerta } from '../services/alertService';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ZONA_COLORS: Record<string, string> = {
  'Zona A': '#3b82f6',
  'Zona B': '#22c55e',
  'Zona C': '#ef4444',
  'Zona D': '#f97316',
  'default': '#8b5cf6'
};

// Coordenadas del campus UTA Huachi (mismas que admin-panel)
const CAMPUS_CENTER: [number, number] = [-1.269451, -78.623277];
const CAMPUS_ZOOM = 17;

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

// Componente para manejar eventos de clic en el mapa
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e: any) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const MapaScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [zonas, setZonas] = useState<ZonaBackend[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [userPosition, setUserPosition] = useState<PositionData | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [touchedPosition, setTouchedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [campusStatus, setCampusStatus] = useState<{ dentro: boolean; zona: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [alertaEnviada, setAlertaEnviada] = useState(false);
  const [presionandoBoton, setPresionandoBoton] = useState(false);
  const [contadorBoton, setContadorBoton] = useState(3);
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Cargar zonas desde el backend
    const cargarZonas = async () => {
      try {
        const zonasData = await obtenerZonas();
        console.log('Zonas cargadas:', zonasData);
        setZonas(zonasData);
      } catch (error) {
        console.error('Error cargando zonas:', error);
      } finally {
        setLoading(false);
        setMapReady(true);
      }
    };

    cargarZonas();
    const interval = setInterval(cargarZonas, 15000);
    return () => clearInterval(interval);
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

  // Función para manejar clic en el mapa
  const handleMapClick = async (lat: number, lng: number) => {
    console.log('Clic en mapa:', lat, lng);
    setTouchedPosition({ lat, lng });
    setAlertaEnviada(false);

    // Validar si el punto está dentro del campus
    try {
      const validacion = await validarPuntoEnCampus(lat, lng);
      console.log('Validación:', validacion);
      setCampusStatus({
        dentro: validacion.dentroDelCampus,
        zona: validacion.zona
      });

      // Mostrar modal con información del punto
      setShowModal(true);
    } catch (error) {
      console.error('Error validando punto:', error);
      setCampusStatus({ dentro: false, zona: 'Error de validación' });
      setShowModal(true);
    }
  };

  // Función para enviar alerta desde el punto seleccionado
  const handleEnviarAlertaDesdePunto = async () => {
    if (!touchedPosition) return;

    try {
      await enviarAlerta(
        touchedPosition.lat,
        touchedPosition.lng,
        "Emergencia desde punto seleccionado"
      );
      setAlertaEnviada(true);
      setShowModal(false);
      setPresionandoBoton(false);
      setContadorBoton(3);

      // Guardar coordenadas en Preferences
      await Preferences.set({
        key: 'alerta_ubicacion',
        value: JSON.stringify({ latitud: touchedPosition.lat, longitud: touchedPosition.lng })
      });
    } catch (error) {
      console.error('Error enviando alerta:', error);
      setPresionandoBoton(false);
      setContadorBoton(3);
    }
  };

  // Función para iniciar el presionado del botón
  const iniciarPresionBoton = () => {
    setPresionandoBoton(true);
    setContadorBoton(3);

    let tiempo = 3;

    intervalRef.current = setInterval(() => {
      tiempo -= 1;
      setContadorBoton(tiempo);
    }, 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      handleEnviarAlertaDesdePunto();
    }, 3000);
  };

  // Función para cancelar el presionado del botón
  const cancelarPresionBoton = () => {
    if (!presionandoBoton) return;

    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setPresionandoBoton(false);
    setContadorBoton(3);
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  // Validar posición GPS del usuario
  useEffect(() => {
    if (userPosition) {
      validarPuntoEnCampus(userPosition.latitud, userPosition.longitud)
        .then(validacion => {
          setCampusStatus({
            dentro: validacion.dentroDelCampus,
            zona: validacion.zona
          });
        })
        .catch(error => {
          console.error('Error validando posición GPS:', error);
        });
    }
  }, [userPosition]);

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
              <MapClickHandler onMapClick={handleMapClick} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {zonas.filter((z: ZonaBackend) => z.estado !== 'Inactiva').map((zona: ZonaBackend) => {
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
                    eventHandlers={{
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        handleMapClick(e.latlng.lat, e.latlng.lng);
                      }
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

              {/* Marcador de posición tocada por el usuario */}
              {touchedPosition && (
                <Marker position={[touchedPosition.lat, touchedPosition.lng]}>
                  <Popup>
                    <strong>Ubicación seleccionada</strong><br />
                    Lat: {touchedPosition.lat.toFixed(6)}<br />
                    Lng: {touchedPosition.lng.toFixed(6)}<br />
                    <em>Esta ubicación se usará para la alerta</em>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            <IonCard className="info-card">
              <IonCardContent>
                <IonText>
                  <p><strong>Mapa del Campus UTA Huachi</strong></p>
                  <p className="info-text">Las 4 zonas del campus están delimitadas en el mapa.</p>
                  <p className="info-text">Toca el mapa para registrar tu ubicación.</p>
                  
                  {campusStatus && (
                    <p className={campusStatus.dentro ? 'success-text' : 'warning-text'}>
                      <IonBadge color={campusStatus.dentro ? 'success' : 'warning'}>
                        {campusStatus.dentro ? 'Dentro del campus' : 'Fuera del campus'}
                      </IonBadge>
                      {campusStatus.dentro ? ` - ${campusStatus.zona}` : ''}
                    </p>
                  )}
                  
                  {!campusStatus?.dentro && (
                    <p className="warning-text">
                      <em>El mapa sigue funcionando normalmente</em>
                    </p>
                  )}
                  
                  {touchedPosition && (
                    <p className="success-text">
                      <IonBadge color="primary">Ubicación seleccionada</IonBadge><br />
                      Lat: {touchedPosition.lat.toFixed(6)}<br />
                      Lng: {touchedPosition.lng.toFixed(6)}
                    </p>
                  )}
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

      {/* Modal de información del punto seleccionado */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Información del Punto</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {campusStatus?.dentro ? (
            <div>
              <IonCard>
                <IonCardContent>
                  <h2>📍 Punto dentro del campus</h2>
                  <p><strong>Zona:</strong> {campusStatus.zona}</p>
                  <p><strong>Latitud:</strong> {touchedPosition?.lat.toFixed(6)}</p>
                  <p><strong>Longitud:</strong> {touchedPosition?.lng.toFixed(6)}</p>
                  <IonButton
                    expand="block"
                    color="danger"
                    onMouseDown={iniciarPresionBoton}
                    onMouseUp={cancelarPresionBoton}
                    onMouseLeave={cancelarPresionBoton}
                    onTouchStart={iniciarPresionBoton}
                    onTouchEnd={cancelarPresionBoton}
                  >
                    {presionandoBoton ? (
                      <>
                        <strong>{contadorBoton}</strong>
                        <span>segundos</span>
                      </>
                    ) : (
                      <>
                        <strong>🚨</strong>
                        <span>Mantén presionado 3s para enviar alerta</span>
                      </>
                    )}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          ) : (
            <div>
              <IonCard>
                <IonCardContent>
                  <h2>⚠️ Punto fuera del campus UTA</h2>
                  <p>El punto seleccionado no está dentro de las 4 zonas delimitadas del campus.</p>
                  <p><strong>Latitud:</strong> {touchedPosition?.lat.toFixed(6)}</p>
                  <p><strong>Longitud:</strong> {touchedPosition?.lng.toFixed(6)}</p>
                  <IonText color="danger">
                    <p>No se puede enviar una alerta desde este punto.</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Alerta de confirmación de envío */}
      <IonAlert
        isOpen={alertaEnviada}
        onDidDismiss={() => setAlertaEnviada(false)}
        header="Alerta Enviada"
        message="La alerta se ha enviado correctamente desde el punto seleccionado."
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default MapaScreen;
