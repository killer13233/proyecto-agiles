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

// ── Listar TODOS los grupos (admin) ────────────────────────────────────
export const getGruposConfianza = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.LISTAR_TODOS}`,
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al obtener grupos de confianza:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al obtener grupos de confianza'
    };
  }
};

// ── Obtener detalle de un grupo ────────────────────────────────────────
export const getGrupoDetalle = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.DETALLE(id)}`,
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al obtener detalle del grupo:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al obtener detalle del grupo'
    };
  }
};

// ── Crear grupo ────────────────────────────────────────────────────────
export const crearGrupoConfianza = async (nombre, descripcion) => {
  try {
    const response = await axios.post(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.CREAR}`,
      { nombre, descripcion },
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al crear grupo:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al crear grupo'
    };
  }
};

// ── Actualizar grupo ───────────────────────────────────────────────────
export const actualizarGrupoConfianza = async (id, nombre, descripcion) => {
  try {
    await axios.put(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.ACTUALIZAR(id)}`,
      { nombre, descripcion },
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al actualizar grupo'
    };
  }
};

// ── Eliminar grupo ─────────────────────────────────────────────────────
export const eliminarGrupoConfianza = async (id) => {
  try {
    await axios.delete(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.ELIMINAR(id)}`,
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar grupo:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al eliminar grupo'
    };
  }
};

// ── Agregar miembro ────────────────────────────────────────────────────
export const agregarMiembroGrupo = async (grupoId, usuarioId) => {
  try {
    await axios.post(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.AGREGAR_MIEMBRO(grupoId)}`,
      { usuarioId },
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error) {
    console.error('Error al agregar miembro:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al agregar miembro'
    };
  }
};

// ── Quitar miembro ─────────────────────────────────────────────────────
export const quitarMiembroGrupo = async (grupoId, miembroId) => {
  try {
    await axios.delete(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.QUITAR_MIEMBRO(grupoId, miembroId)}`,
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error) {
    console.error('Error al quitar miembro:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al quitar miembro'
    };
  }
};

// ── Buscar usuarios ────────────────────────────────────────────────────
export const buscarUsuariosGrupo = async (grupoId, query) => {
  try {
    const response = await axios.get(
      `${API_BASE}${ENDPOINTS.GRUPOS_CONFIANZA.BUSCAR_USUARIOS(grupoId, query)}`,
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    return {
      success: false,
      error: error.response?.data?.mensaje || 'Error al buscar usuarios'
    };
  }
};
