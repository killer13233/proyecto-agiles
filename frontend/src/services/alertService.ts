import axios from "axios";

const API_ALERTAS = import.meta.env.VITE_API_ALERTAS;

export const enviarAlerta = async (
  latitud: number,
  longitud: number,
  motivo: string
) => {
  const response = await axios.post(`${API_ALERTAS}/api/alertas`, {
    latitud,
    longitud,
    motivo,
  });

  return response.data;
};