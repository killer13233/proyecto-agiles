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
    const params = new URLSearchParams();
    if (filtros.estado)     params.append('estado', filtros.estado);
    if (filtros.prioridad)  params.append('prioridad', filtros.prioridad);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde); // ← nombre correcto
    if (filtros.usuario)    params.append('usuario', filtros.usuario);
    params.append('_t', Date.now().toString());

    const response = await axios.get(
      `${API_BASE}/api/alertas?${params.toString()}`,
      { headers: getHeaders() }
    );

    let alertas = response.data?.alertas || response.data || [];
    if (!Array.isArray(alertas)) alertas = [];

    // Filtrado en el frontend como respaldo (por si el backend no filtra)
    if (filtros.estado)     alertas = alertas.filter(a => (a.estado || a.Estado) === filtros.estado);
    if (filtros.usuario)    alertas = alertas.filter(a => 
      (a.nombreUsuario || a.NombreUsuario || '').toLowerCase().includes(filtros.usuario.toLowerCase())
    );
    if (filtros.fechaDesde) alertas = alertas.filter(a => {
      const fecha = new Date(a.creadaEn || a.CreadaEn);
      return fecha >= new Date(filtros.fechaDesde);
    });

    return { success: true, data: alertas };
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return { success: false, error: 'Error al obtener alertas del servidor' };
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
    const response = await axios.post(  // ← post, no patch
      `${API_BASE}/api/alertas/${idAlerta}/cerrar`,
      { motivoCierre: motivo },
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al cerrar alerta:', error);
    return { success: false, error: 'Error al cerrar alerta del servidor' };
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
  return ['Activa', 'Asumida', 'Cerrada'];
};