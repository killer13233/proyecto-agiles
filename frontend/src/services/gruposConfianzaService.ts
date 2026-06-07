import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8090";

// Obtener token del storage
const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ── Listar mis grupos ──────────────────────────────────────────────────
export const listarMisGrupos = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/gruposconfianza`, {
      headers: getHeaders(),
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error al listar grupos:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al cargar los grupos",
    };
  }
};

// ── Obtener detalle de un grupo ────────────────────────────────────────
export const obtenerGrupo = async (id: number) => {
  try {
    const response = await axios.get(`${API_BASE}/api/gruposconfianza/${id}`, {
      headers: getHeaders(),
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error al obtener grupo:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al obtener el grupo",
    };
  }
};

// ── Crear grupo ────────────────────────────────────────────────────────
export const crearGrupo = async (nombre: string, descripcion?: string) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/gruposconfianza`,
      { nombre, descripcion },
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error al crear grupo:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al crear el grupo",
    };
  }
};

// ── Actualizar grupo ───────────────────────────────────────────────────
export const actualizarGrupo = async (
  id: number,
  nombre: string,
  descripcion?: string
) => {
  try {
    await axios.put(
      `${API_BASE}/api/gruposconfianza/${id}`,
      { nombre, descripcion },
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar grupo:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al actualizar el grupo",
    };
  }
};

// ── Eliminar grupo ─────────────────────────────────────────────────────
export const eliminarGrupo = async (id: number) => {
  try {
    await axios.delete(`${API_BASE}/api/gruposconfianza/${id}`, {
      headers: getHeaders(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar grupo:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al eliminar el grupo",
    };
  }
};

// ── Agregar miembro ────────────────────────────────────────────────────
export const agregarMiembro = async (grupoId: number, usuarioId: number) => {
  try {
    await axios.post(
      `${API_BASE}/api/gruposconfianza/${grupoId}/miembros`,
      { usuarioId },
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error al agregar miembro:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al agregar miembro",
    };
  }
};

// ── Quitar miembro ─────────────────────────────────────────────────────
export const quitarMiembro = async (grupoId: number, miembroId: number) => {
  try {
    await axios.delete(
      `${API_BASE}/api/gruposconfianza/${grupoId}/miembros/${miembroId}`,
      { headers: getHeaders() }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error al quitar miembro:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al quitar miembro",
    };
  }
};

// ── Buscar usuarios para agregar ───────────────────────────────────────
export const buscarUsuarios = async (grupoId: number, query: string) => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/gruposconfianza/${grupoId}/buscar-usuarios?q=${encodeURIComponent(query)}`,
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error al buscar usuarios:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al buscar usuarios",
    };
  }
};

// ── Listar Invitaciones Pendientes ───────────────────────────────────────
export const listarInvitaciones = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/gruposconfianza/invitaciones`,
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error al listar invitaciones:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al cargar invitaciones",
    };
  }
};

// ── Responder a Invitación ──────────────────────────────────────────────
export const responderInvitacion = async (grupoId: number, aceptar: boolean) => {
  try {
    const response = await axios.put(
      `${API_BASE}/api/gruposconfianza/${grupoId}/invitaciones/responder?aceptar=${aceptar}`,
      {},
      { headers: getHeaders() }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error al responder invitación:", error);
    return {
      success: false,
      error: error.response?.data?.mensaje || "Error al responder invitación",
    };
  }
};
