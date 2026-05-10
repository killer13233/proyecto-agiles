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

// Obtener todas las zonas
export const getZonas = async () => {
  try {
    // Llamar al backend real
    const response = await axios.get(
      `${API_BASE}/api/zonas`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    return {
      success: false,
      error: 'Error al obtener zonas del servidor'
    };
  }
};

// Crear nueva zona
export const crearZona = async (zonaData) => {
  try {
    // Llamar al backend real
    const response = await axios.post(
      `${API_BASE}/api/zonas`,
      zonaData,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al crear zona:', error);
    return {
      success: false,
      error: 'Error al crear zona en el servidor'
    };
  }
};

// Actualizar zona
export const actualizarZona = async (id, zonaData) => {
  try {
    // Llamar al backend real
    const response = await axios.put(
      `${API_BASE}/api/zonas/${id}`,
      zonaData,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al actualizar zona:', error);
    return {
      success: false,
      error: 'Error al actualizar zona en el servidor'
    };
  }
};

// Eliminar zona
export const eliminarZona = async (id) => {
  try {
    // Llamar al backend real
    const response = await axios.delete(
      `${API_BASE}/api/zonas/${id}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al eliminar zona:', error);
    return {
      success: false,
      error: 'Error al eliminar zona del servidor'
    };
  }
};

// Cambiar estado de zona
export const cambiarEstadoZona = async (id, nuevoEstado) => {
  try {
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/zonas/${id}/estado`,
      { estado: nuevoEstado },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar estado de zona:', error);
    return {
      success: false,
      error: 'Error al cambiar estado de zona en el servidor'
    };
  }
};
