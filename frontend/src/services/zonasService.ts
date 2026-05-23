import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';

export interface Zona {
  id: number;
  nombre: string;
  color: string;
  poligono: string;
}

export interface PuntoEnZonaResponse {
  zona: string;
  dentroDelCampus: boolean;
}

export const obtenerZonas = async (): Promise<Zona[]> => {
  try {
    const response = await axios.get<Zona[]>(
      `${API_GATEWAY_URL}/api/zonas`,
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo zonas:', error);
    return [];
  }
};

export const validarPuntoEnCampus = async (lat: number, lng: number): Promise<PuntoEnZonaResponse> => {
  try {
    const response = await axios.get<PuntoEnZonaResponse>(
      `${API_GATEWAY_URL}/api/zonas/punto`,
      {
        params: { lat, lon: lng },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error validando punto en campus:', error);
    // Si falla el backend, retornar respuesta por defecto
    return {
      zona: 'Zona No Definida',
      dentroDelCampus: false
    };
  }
};
