import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export const obtenerUbicacion = async (): Promise<{ latitud: number; longitud: number }> => {
  
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
  };
};