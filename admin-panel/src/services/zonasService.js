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
    const payload = {
      nombre: zonaData.nombre,
      descripcion: zonaData.descripcion || '',
      color: zonaData.color || '#10b981',
      estado: zonaData.estado || 'Activa',
      poligono: zonaData.poligono
    };

    // Llamar al backend real
    const response = await axios.post(
      `${API_BASE}/api/zonas`,
      payload,
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
    const payload = {
      nombre: zonaData.nombre,
      descripcion: zonaData.descripcion || '',
      color: zonaData.color || '#10b981',
      estado: zonaData.estado || 'Activa',
      poligono: zonaData.poligono
    };

    // Llamar al backend real
    const response = await axios.put(
      `${API_BASE}/api/zonas/${id}`,
      payload,
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

// Obtener todas las cámaras
export const getCamaras = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/zonas/camaras`,
      { headers: getHeaders() }
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener cámaras:', error);
    return {
      success: false,
      error: 'Error al obtener cámaras del servidor'
    };
  }
};

// Obtener cámaras por zona
export const getCamarasPorZona = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/zonas/${id}/camaras`,
      { headers: getHeaders() }
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener cámaras de la zona:', error);
    return {
      success: false,
      error: 'Error al obtener cámaras de la zona'
    };
  }
};

// Crear cámara
export const crearCamara = async (camaraData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/zonas/camaras`,
      camaraData,
      { headers: getHeaders() }
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al crear cámara:', error);
    return {
      success: false,
      error: 'Error al crear cámara en el servidor'
    };
  }
};

// Eliminar cámara
export const eliminarCamara = async (id) => {
  try {
    const response = await axios.delete(
      `${API_BASE}/api/zonas/camaras/${id}`,
      { headers: getHeaders() }
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al eliminar cámara:', error);
    return {
      success: false,
      error: 'Error al eliminar cámara del servidor'
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
