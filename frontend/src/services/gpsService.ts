import { Geolocation } from "@capacitor/geolocation";

export const obtenerUbicacion = async () => {
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