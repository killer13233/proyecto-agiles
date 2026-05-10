import axios from 'axios';
import { API_BASE, ENDPOINTS } from './config';

// Obtener token del localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Configurar headers con JWT
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Obtener alertas con filtros
export const getAlertas = async (filtros = {}) => {
  try {
    // Llamar al backend real
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
    if (filtros.fecha) params.append('fecha', filtros.fecha);
    
    const response = await axios.get(
      `${API_BASE}/api/alertas?${params.toString()}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return {
      success: false,
      error: 'Error al obtener alertas del servidor'
    };
  }
};

// Asignar alerta a guardia
export const asignarAlerta = async (idAlerta, guardiaId, nombreGuardia) => {
  try {
    console.log(`Intentando asignar guardia ${guardiaId} (${nombreGuardia}) a alerta ${idAlerta}`);
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/alertas/${idAlerta}/asumir`,
      { guardiaId, nombreGuardia },
      { headers: getHeaders() }
    );

    console.log(`Asignación exitosa:`, response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al asignar alerta:', error);
    return {
      success: false,
      error: 'Error al asignar alerta del servidor'
    };
  }
};

// Cerrar alerta
export const cerrarAlerta = async (idAlerta, motivo = '') => {
  try {
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/alertas/${idAlerta}/cerrar`,
      { motivoCierre: motivo },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cerrar alerta:', error);
    return {
      success: false,
      error: 'Error al cerrar alerta del servidor'
    };
  }
};

// Obtener tipos de alerta válidos
export const getTiposAlerta = () => {
  return ['Seguridad', 'Médica', 'Mantenimiento', 'Incendio', 'Otro'];
};

// Obtener prioridades válidas
export const getPrioridadesAlerta = () => {
  return ['Baja', 'Media', 'Alta', 'Crítica'];
};

// Obtener estados válidos
export const getEstadosAlerta = () => {
  return ['Activa', 'Asignada', 'Cerrada', 'Cancelada'];
};
