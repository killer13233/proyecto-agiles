import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface PuntoEnZonaResponse {
  zona: string;
  dentroDelCampus: boolean;
}

export const validarPuntoEnCampus = async (lat: number, lng: number): Promise<PuntoEnZonaResponse> => {
  try {
    const response = await axios.get<PuntoEnZonaResponse>(
      `${API_BASE_URL}/zonas/punto`,
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
