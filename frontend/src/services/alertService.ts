import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.0.104:8090";

const getToken = async (): Promise<string> => {
  // En móvil usar Preferences, en web usar localStorage
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: "token" });
    return value || "";
  }
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
};

export const enviarAlerta = async (
  latitud: number,
  longitud: number,
  motivo: string
) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_BASE}/api/alertas`,
    { latitud, longitud, motivo },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};