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

// Datos mock para desarrollo
const dashboardMock = {
  usuarios: {
    total: 156,
    activos: 142,
    inactivos: 14,
    nuevosMes: 23,
    crecimiento: 12.5
  },
  alertas: {
    total: 89,
    activas: 12,
    asignadas: 34,
    cerradas: 43,
    criticas: 3,
    nuevasHoy: 5,
    resueltasHoy: 8
  },
  zonas: {
    total: 28,
    activas: 25,
    inactivas: 3,
    nuevasMes: 2,
    cobertura: 85.7
  },
  actividades: [
    {
      id: 1,
      tipo: 'alerta_asignada',
      descripcion: 'Alerta de seguridad asignada a Juan Paredes',
      timestamp: '2024-05-09T15:30:00Z',
      usuario: 'Juan Paredes',
      detalles: 'Intruso detectado en Facultad de Ingeniería'
    },
    {
      id: 2,
      tipo: 'zona_creada',
      descripcion: 'Nueva zona de monitoreo creada',
      timestamp: '2024-05-09T14:45:00Z',
      usuario: 'Maria Rodriguez',
      detalles: 'Zona Laboratorio 301 - 50m radio'
    },
    {
      id: 3,
      tipo: 'alerta_cerrada',
      descripcion: 'Alerta médica resuelta exitosamente',
      timestamp: '2024-05-09T13:20:00Z',
      usuario: 'Martin Palacios',
      detalles: 'Estudiante atendido y trasladado a enfermería'
    },
    {
      id: 4,
      tipo: 'usuario_creado',
      descripcion: 'Nuevo usuario registrado en el sistema',
      timestamp: '2024-05-09T12:15:00Z',
      usuario: 'Sheyla Pacha',
      detalles: 'Usuario con rol de Guardia'
    },
    {
      id: 5,
      tipo: 'alerta_critica',
      descripcion: 'Alerta crítica de seguridad activada',
      timestamp: '2024-05-09T11:30:00Z',
      usuario: 'Sistema',
      detalles: 'Detección de movimiento no autorizado en Biblioteca'
    }
  ],
  estadisticas: {
    alertasPorDia: [
      { dia: 'Lun', cantidad: 12 },
      { dia: 'Mar', cantidad: 8 },
      { dia: 'Mie', cantidad: 15 },
      { dia: 'Jue', cantidad: 10 },
      { dia: 'Vie', cantidad: 18 },
      { dia: 'Sab', cantidad: 6 },
      { dia: 'Dom', cantidad: 4 }
    ],
    alertasPorTipo: [
      { tipo: 'Seguridad', cantidad: 45 },
      { tipo: 'Médica', cantidad: 23 },
      { tipo: 'Mantenimiento', cantidad: 12 },
      { tipo: 'Incendio', cantidad: 3 },
      { tipo: 'Otro', cantidad: 6 }
    ],
    usuariosPorRol: [
      { rol: 'Administrador', cantidad: 8 },
      { rol: 'Guardia', cantidad: 142 },
      { rol: 'Supervisor', cantidad: 6 }
    ]
  }
};

// Obtener datos del dashboard
export const getDashboardData = async () => {
  try {
    // Llamar al backend real
    const response = await axios.get(
      `${API_BASE}/api/dashboard`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    // Fallback a datos mock si el backend no está disponible
    return {
      success: true,
      data: dashboardMock
    };
  }
};

// Obtener estadísticas de alertas por período
export const getAlertasEstadisticas = async (periodo = '7d') => {
  try {
    // Llamar al backend real
    const response = await axios.get(
      `${API_BASE}/api/alertas/estadisticas?periodo=${periodo}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de alertas:', error);
    // Fallback a datos mock si el backend no está disponible
    return {
      success: true,
      data: {
        periodo,
        total: dashboardMock.alertas.total,
        tendencia: '+15%',
        promedioDiario: 12.7,
        picoHoras: ['08:00', '12:00', '18:00']
      }
    };
  }
};

// Obtener actividad reciente
export const getActividadReciente = async (limite = 10) => {
  try {
    // Llamar al backend real
    const response = await axios.get(
      `${API_BASE}/api/dashboard/actividad?limite=${limite}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    // Fallback a datos mock si el backend no está disponible
    return {
      success: true,
      data: dashboardMock.actividades.slice(0, limite)
    };
  }
};
