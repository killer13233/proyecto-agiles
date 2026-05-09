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

// Alertas mock para desarrollo
const alertasMock = [
  {
    id: 1,
    titulo: 'Intruso detectado en Facultad de Ingeniería',
    descripcion: 'Se detectó movimiento sospechoso cerca del laboratorio principal',
    tipo: 'Seguridad',
    estado: 'Activa',
    prioridad: 'Alta',
    ubicacion: 'Facultad de Ingeniería - Laboratorio 301',
    latitud: -1.241667,
    longitud: -78.619444,
    usuarioAsignado: null,
    fechaCreacion: '2024-05-09T10:30:00Z',
    fechaAsignacion: null,
    reportadoPor: 'Sistema Automático',
    imagenes: ['https://via.placeholder.com/150x150/ff6b6b/000000/ffffff?text=ALERTA']
  },
  {
    id: 2,
    titulo: 'Emergencia médica en Campus Deportivo',
    descripcion: 'Estudiante requiere atención médica inmediata',
    tipo: 'Médica',
    estado: 'Asignada',
    prioridad: 'Crítica',
    ubicacion: 'Campus Deportivo - Cancha de básquet',
    latitud: -1.240876,
    longitud: -78.618567,
    usuarioAsignado: 'Juan Paredes',
    fechaCreacion: '2024-05-09T11:45:00Z',
    fechaAsignacion: '2024-05-09T11:50:00Z',
    reportadoPor: 'Maria Rodriguez',
    imagenes: ['https://via.placeholder.com/150x150/dc2626/000000/ffffff?text=EMERGENCIA']
  },
  {
    id: 3,
    titulo: 'Objeto sospechoso en Biblioteca',
    descripcion: 'Maletín abandonado cerca de la sección de referencia',
    tipo: 'Seguridad',
    estado: 'Cerrada',
    prioridad: 'Media',
    ubicacion: 'Biblioteca Central - Segundo piso',
    latitud: -1.242567,
    longitud: -78.620234,
    usuarioAsignado: 'Martin Palacios',
    fechaCreacion: '2024-05-09T09:15:00Z',
    fechaAsignacion: '2024-05-09T10:00:00Z',
    fechaCierre: '2024-05-09T10:30:00Z',
    reportadoPor: 'Sistema Automático',
    imagenes: ['https://via.placeholder.com/150x150/f59e0b/000000/ffffff?text=SOSPECHA']
  },
  {
    id: 4,
    titulo: 'Falla eléctrica en Laboratorios',
    descripcion: 'Corte de energía en área de laboratorios de informática',
    tipo: 'Mantenimiento',
    estado: 'Activa',
    prioridad: 'Media',
    ubicacion: 'Laboratorios - Edificio B',
    latitud: -1.242567,
    longitud: -78.620234,
    usuarioAsignado: null,
    fechaCreacion: '2024-05-09T14:20:00Z',
    fechaAsignacion: null,
    reportadoPor: 'Carlos Mendoza',
    imagenes: ['https://via.placeholder.com/150x150/eab308/000000/ffffff?text=FALLA']
  },
  {
    id: 5,
    titulo: 'Accidente vehicular en entrada principal',
    descripcion: 'Colisión entre dos vehículos en la entrada de la universidad',
    tipo: 'Seguridad',
    estado: 'Activa',
    prioridad: 'Alta',
    ubicacion: 'Entrada Principal - Portón',
    latitud: -1.241234,
    longitud: -78.617890,
    usuarioAsignado: 'Sheyla Pacha',
    fechaCreacion: '2024-05-09T15:30:00Z',
    fechaAsignacion: '2024-05-09T15:35:00Z',
    reportadoPor: 'Abel Chiriboga',
    imagenes: ['https://via.placeholder.com/150x150/ef4444/000000/ffffff?text=ACCIDENTE']
  }
];

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
    // Fallback a datos mock si el backend no está disponible
    let alertasFiltradas = [...alertasMock];
    
    if (filtros.estado) {
      alertasFiltradas = alertasFiltradas.filter(a => a.estado === filtros.estado);
    }
    if (filtros.tipo) {
      alertasFiltradas = alertasFiltradas.filter(a => a.tipo === filtros.tipo);
    }
    if (filtros.prioridad) {
      alertasFiltradas = alertasFiltradas.filter(a => a.prioridad === filtros.prioridad);
    }
    
    return {
      success: true,
      data: { alertas: alertasFiltradas }
    };
  }
};

// Asignar alerta a usuario
export const asignarAlerta = async (idAlerta, idUsuario) => {
  try {
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/alertas/${idAlerta}/asignar`,
      { usuarioAsignado: idUsuario },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al asignar alerta:', error);
    // Fallback a datos mock si el backend no está disponible
    const alerta = alertasMock.find(a => a.id === idAlerta);
    if (alerta) {
      alerta.estado = 'Asignada';
      alerta.usuarioAsignado = idUsuario;
      alerta.fechaAsignacion = new Date().toISOString();
      
      return {
        success: true,
        data: alerta
      };
    }
    
    return {
      success: false,
      error: 'Alerta no encontrada'
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
    // Fallback a datos mock si el backend no está disponible
    const alerta = alertasMock.find(a => a.id === idAlerta);
    if (alerta) {
      alerta.estado = 'Cerrada';
      alerta.fechaCierre = new Date().toISOString();
      alerta.motivoCierre = motivo;
      
      return {
        success: true,
        data: alerta
      };
    }
    
    return {
      success: false,
      error: 'Alerta no encontrada'
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
