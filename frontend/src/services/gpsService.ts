import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export interface PositionData {
  latitud: number;
  longitud: number;
  precision?: number;
}

export const obtenerUbicacion = async (): Promise<PositionData> => {
  
  // En web usar navigator.geolocation
  if (!Capacitor.isNativePlatform()) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no disponible en este navegador"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: pos.coords.accuracy,
        }),
        (err) => reject(new Error("GPS denegado o no disponible"))
      );
    });
  }

  // En móvil (APK) usar Capacitor
  const permission = await Geolocation.requestPermissions();
  if (permission.location !== "granted") {
    throw new Error("Permiso de ubicación denegado");
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });

  return {
    latitud: position.coords.latitude,
    longitud: position.coords.longitude,
    precision: position.coords.accuracy,
  };
};

// Seguimiento continuo de posición GPS
export const iniciarSeguimientoGPS = (
  callback: (position: PositionData) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  let watchId: string | number | null = null;

  if (!Capacitor.isNativePlatform()) {
    // Web: usar navigator.geolocation.watchPosition
    if (!navigator.geolocation) {
      errorCallback?.(new Error("Geolocalización no disponible en este navegador"));
      return () => {};
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        callback({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: pos.coords.accuracy,
        });
      },
      (err) => {
        errorCallback?.(new Error("GPS denegado o no disponible"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId as number);
      }
    };
  }

  // Móvil: usar Capacitor Geolocation.watchPosition
  Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    },
    (position) => {
      if (position) {
        callback({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          precision: position.coords.accuracy,
        });
      }
    }
  ).then((id) => {
    watchId = id;
  }).catch((err) => {
    errorCallback?.(new Error("Error al iniciar seguimiento GPS"));
  });

  return () => {
    if (watchId !== null) {
      Geolocation.clearWatch({ id: watchId as string });
    }
  };
};