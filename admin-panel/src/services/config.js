// Configuración de endpoints y variables de entorno
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8090';
export const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8082';

// Endpoints de los microservicios
export const ENDPOINTS = {
  // Microservicio A - Usuarios y Auth (puerto 8081)
  AUTH: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh'
  },
  USUARIOS: {
    LISTAR: '/api/usuarios',
    CAMBIAR_ROL: (id) => `/api/usuarios/${id}/rol`,
    CAMBIAR_ESTADO: (id) => `/api/usuarios/${id}/estado`,
    DETALLE: (id) => `/api/usuarios/${id}`
  },
  
  // Microservicio B - Alertas (puerto 8082)
  ALERTAS: {
    LISTAR: '/api/alertas',
    FILTRAR: '/api/alertas',
    DETALLE: (id) => `/api/alertas/${id}`
  },
  
  // Microservicio C - Zonas (puerto 8083)
  ZONAS: {
    LISTAR: '/api/zonas',
    CREAR: '/api/zonas',
    ACTUALIZAR: (id) => `/api/zonas/${id}`,
    ELIMINAR: (id) => `/api/zonas/${id}`,
    DETALLE: (id) => `/api/zonas/${id}`
  }
};

// URLs completas para desarrollo
export const API_URLS = {
  AUTH_LOGIN: `${API_BASE}/api/auth/login`,
  USUARIOS_LISTAR: `${API_BASE}/api/usuarios`,
  ALERTAS_LISTAR: `${API_BASE}/api/alertas`,
  ZONAS_LISTAR: `${API_BASE}/api/zonas`
};
