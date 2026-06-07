import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardContent, IonText, IonSpinner, IonBadge } from '@ionic/react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaScreen.css';
import { obtenerUbicacion, iniciarSeguimientoGPS, PositionData } from '../services/gpsService';
import { validarPuntoEnCampus, obtenerZonas, Zona as ZonaBackend } from '../services/zonasService';
import { enviarAlerta } from '../services/alertService';
import { wsService } from '../services/wsService';
import ModalMapaAlerta, { MotivoEmergencia } from '../components/ModalMapaAlerta';

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

const CAMPUS_CENTER: [number, number] = [-1.269451, -78.623277];
const CAMPUS_ZOOM = 17;

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

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e: any) { onMapClick(e.latlng.lat, e.latlng.lng); }
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
  const [modalVisible, setModalVisible] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'warning' | 'error' } | null>(null);
  const toastTimer = useRef<any>(null);
  const rastreoRef = useRef<(() => void) | null>(null);
  const alertaActivaIdRef = useRef<number | null>(null);

  const mostrarToast = (mensaje: string, tipo: 'success' | 'warning' | 'error') => {
    setToast({ mensaje, tipo });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const cargarZonas = async () => {
      try {
        const zonasData = await obtenerZonas();
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
    obtenerUbicacion()
      .then((position) => { setUserPosition(position); setGpsError(null); })
      .catch((error) => { setGpsError(error.message); });

    const cleanup = iniciarSeguimientoGPS(
      (position) => { setUserPosition(position); setGpsError(null); },
      (error) => { setGpsError(error.message); }
    );
    return cleanup;
  }, [mapReady]);

  useEffect(() => {
    if (userPosition) {
      validarPuntoEnCampus(userPosition.latitud, userPosition.longitud)
        .then(validacion => setCampusStatus({ dentro: validacion.dentroDelCampus, zona: validacion.zona }))
        .catch(error => console.error('Error validando posición GPS:', error));
    }
  }, [userPosition]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const cerradoId = detail.id ?? detail.Id;
      if (cerradoId === alertaActivaIdRef.current) {
        if (rastreoRef.current) {
          rastreoRef.current();
          rastreoRef.current = null;
        }
        alertaActivaIdRef.current = null;
      }
    };
    window.addEventListener('app-alerta-cerrada', handler);
    return () => {
      window.removeEventListener('app-alerta-cerrada', handler);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const handleMapClick = async (lat: number, lng: number) => {
    setTouchedPosition({ lat, lng });
    try {
      const validacion = await validarPuntoEnCampus(lat, lng);
      if (validacion.dentroDelCampus) {
        setModalVisible(true); // ← abre modal de motivo
      } else {
        mostrarToast('⚠️ Ese punto está fuera del campus', 'warning');
      }
    } catch (error) {
      console.error('Error validando punto:', error);
      mostrarToast('❌ Error al validar la ubicación', 'error');
    }
  };

  const handleConfirmarMotivo = async (motivo: MotivoEmergencia, descripcion?: string) => {
    setModalVisible(false);
    if (!touchedPosition) return;

    const motivoFinal = motivo === 'Otro' && descripcion ? descripcion : motivo;

    try {
      const response = await enviarAlerta(touchedPosition.lat, touchedPosition.lng, motivoFinal);
      mostrarToast('✅ Alerta enviada correctamente', 'success');

      const alertaId = response?.id || response?.Id;
      if (alertaId) {
        alertaActivaIdRef.current = alertaId;
        rastreoRef.current = iniciarSeguimientoGPS(
          (pos) => {
            wsService.send({
              tipo: "ubicacion_usuario",
              alertaId,
              latitud: pos.latitud,
              longitud: pos.longitud,
            });
          },
          (err) => console.warn("GPS error en rastreo:", err)
        );
      }
    } catch (error) {
      console.error('Error enviando alerta:', error);
      mostrarToast('❌ Error al enviar la alerta', 'error');
    }
  };

  const handleCancelarModal = () => {
    setModalVisible(false);
    setTouchedPosition(null);
  };

  const parsePolygon = (poligono: string): [number, number][] => {
    try {
      const parsed = JSON.parse(poligono || '[]');
      const coords = parsed.coordinates ? parsed.coordinates[0] : parsed;
      if (Array.isArray(coords)) return coords.map((coord: any) => [coord[1], coord[0]]);
    } catch (e) {
      console.error('Error parsing polygon:', e);
    }
    return [];
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--app-bg-secondary)', '--color': 'var(--app-text)' }}>
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
            {toast && (
              <div className={`mapa-toast ${toast.tipo}`}>
                <p>{toast.mensaje}</p>
              </div>
            )}

            <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} style={{ height: '100%', width: '100%' }}>
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
                    pathOptions={{ color: zona.color || ZONA_COLORS.default, fillColor: zona.color || ZONA_COLORS.default, fillOpacity: 0.3, weight: 2 }}
                    eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); handleMapClick(e.latlng.lat, e.latlng.lng); } }}
                  >
                    <Popup>{zona.nombre}</Popup>
                  </Polygon>
                );
              })}
              {userPosition && (
                <>
                  <CircleMarker
                    center={[userPosition.latitud, userPosition.longitud]}
                    radius={userPosition.precision || 20}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }}
                  />
                  <Marker position={[userPosition.latitud, userPosition.longitud]}>
                    <Popup>
                      <strong>Tu ubicación</strong><br />
                      Lat: {userPosition.latitud.toFixed(6)}<br />
                      Lng: {userPosition.longitud.toFixed(6)}
                    </Popup>
                  </Marker>
                </>
              )}
              {touchedPosition && (
                <Marker position={[touchedPosition.lat, touchedPosition.lng]}>
                  <Popup>
                    <strong>Incidente aquí</strong><br />
                    Lat: {touchedPosition.lat.toFixed(6)}<br />
                    Lng: {touchedPosition.lng.toFixed(6)}
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            <div className="mapa-hint">
  📍 Toca el mapa donde ocurrió el incidente
</div>
          </div>
        )}
      </IonContent>

     <ModalMapaAlerta
  visible={modalVisible}
  onConfirmar={handleConfirmarMotivo}
  onCancelar={handleCancelarModal}
/>
    </IonPage>
  );
};

export default MapaScreen;