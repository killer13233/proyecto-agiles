import axios from 'axios';
import { API_BASE, ENDPOINTS } from './config';

// Mapeo de roles: Nombre UI -> Nombre Backend (Enum)
const mapaRoles = {
  'Estudiante': 'Estudiante',
  'Docente': 'Docente',
  'Personal Administrativo': 'PersonalAdministrativo',
  'Guardia': 'Guardia',
  'Administrador': 'Administrador'
};

// Mapeo de estados: Nombre UI -> Nombre Backend (Enum)
const mapaEstados = {
  'Activo': 'Activo',
  'Inactivo': 'Inactivo',
  'Bloqueado': 'Bloqueado'
};

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

export const getUsuarios = async (pagina = 1, tamaño = 10, busqueda = '') => {
  try {
    let url = `${API_BASE}/api/usuarios?pagina=${pagina}&tamaño=${tamaño}`;
    if (busqueda.trim()) {
      url += `&busqueda=${encodeURIComponent(busqueda.trim())}`;
    }
    const response = await axios.get(url, { headers: getHeaders() });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return {
      success: false,
      error: 'Error al obtener usuarios del servidor'
    };
  }
};

// Cambiar rol de usuario
export const cambiarRolUsuario = async (id, nuevoRol) => {
  try {
    // Mapear el nombre del rol de la UI al valor del Enum del backend
    const rolBackend = mapaRoles[nuevoRol] || nuevoRol;
    
    // Llamar al backend real utilizando PUT como requiere el controlador
    const response = await axios.put(
      `${API_BASE}/api/usuarios/${id}/rol`,
      { nuevoRol: rolBackend },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    return {
      success: false,
      error: 'Error al cambiar rol de usuario del servidor'
    };
  }
};

// Cambiar estado de usuario
export const cambiarEstadoUsuario = async (id, nuevoEstado, motivoDesactivacion = null) => {
  try {
    // Mapear el nombre del estado de la UI al valor del Enum del backend
    const estadoLimpio = nuevoEstado.trim();
    const estadoBackend = mapaEstados[estadoLimpio] || estadoLimpio;
    
    const body = { nuevoEstado: estadoBackend };
    if (motivoDesactivacion) {
      body.motivoDesactivacion = motivoDesactivacion;
    }
    
    const response = await axios.patch(
      `${API_BASE}/api/usuarios/${id}/estado`,
      body,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    const serverMsg = error.response?.data?.mensaje;
    return {
      success: false,
      error: serverMsg || 'Error al cambiar estado de usuario del servidor'
    };
  }
};

// Obtener roles válidos
export const getRolesValidos = () => {
  return [
    'Estudiante',
    'Docente',
    'Personal Administrativo',
    'Guardia',
    'Administrador'
  ];
};

export const getGuardias = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/usuarios?rol=Guardia`,
      { headers: getHeaders() }
    );

    // The backend returns a PaginadoResponse with lowercase properties: items, total, tamañoPagina
    const guardiasArray = response.data.items || [];
    return {
      success: true,
      data: guardiasArray
    };
  } catch (error) {
    console.error('Error al obtener guardias:', error);
    return {
      success: false,
      error: 'Error al obtener guardias del servidor'
    };
  }
};
