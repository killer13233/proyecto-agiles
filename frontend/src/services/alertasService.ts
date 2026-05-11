import axios from "axios";
import { Preferences } from "@capacitor/preferences";

const API_BASE = import.meta.env.VITE_API_URL;

const getToken = async () => {
  const { value } = await Preferences.get({ key: "token" });
  return value || "";
};

export const getAlertas = async (estado: string = "Activa") => {
  const token = await getToken();
  const response = await axios.get(`${API_BASE}/api/alertas?estado=${estado}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getZonas = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_BASE}/api/zonas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const asumirAlerta = async (id: number, guardiaId: string, nombreGuardia: string) => {
  const token = await getToken();
  const response = await axios.patch(
    `${API_BASE}/api/alertas/${id}/asumir`,
    { guardiaId, nombreGuardia },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const cerrarAlerta = async (id: number, motivoResolucion: string, resolucionDescripcion: string) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_BASE}/api/alertas/${id}/cerrar`,
    { motivoResolucion, resolucionDescripcion },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
