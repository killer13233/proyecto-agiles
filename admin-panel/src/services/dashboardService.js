import axios from 'axios';
import { API_BASE } from './config';

const getToken = () => localStorage.getItem('token');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const getDashboardData = async () => {
  try {
    // Llamadas paralelas a los microservicios existentes
    const [resUsuarios, resAlertas, resZonas] = await Promise.all([
      axios.get(`${API_BASE}/api/usuarios?tamaño=1000`, { headers: getHeaders() }),
      axios.get(`${API_BASE}/api/alertas`, { headers: getHeaders() }),
      axios.get(`${API_BASE}/api/zonas`, { headers: getHeaders() })
    ]);

    const usuarios = resUsuarios.data.items || resUsuarios.data;
    const alertas = resAlertas.data.alertas || resAlertas.data;
    const zonas = resZonas.data;

    return {
      success: true,
      data: {
        usuarios: {
          total: usuarios.length,
          activos: usuarios.filter(u => u.estado === 'Activo').length,
          inactivos: usuarios.filter(u => u.estado !== 'Activo').length,
          nuevosMes: 0,
          crecimiento: 0
        },
        alertas: {
          total: alertas.length,
          activas: alertas.filter(a => a.estado === 'Activa').length,
          asignadas: alertas.filter(a => a.estado === 'Asignada').length,
          cerradas: alertas.filter(a => a.estado === 'Cerrada').length,
          criticas: 0,
          nuevasHoy: 0,
          resueltasHoy: 0
        },
        zonas: {
          total: zonas.length,
          activas: zonas.filter(z => z.estado === 'Activa').length,
          inactivas: zonas.filter(z => z.estado !== 'Activa').length,
          nuevasMes: 0,
          cobertura: 0
        },
        actividades: alertas.slice(0, 5).map(a => ({
          id: a.id,
          tipo: 'alerta',
          descripcion: `Alerta: ${a.motivo}`,
          timestamp: a.creadaEn,
          usuario: a.nombreUsuario,
          detalles: `Estado: ${a.estado}`
        })),
        estadisticas: {
          alertasPorDia: [],
          alertasPorTipo: {},
          usuariosPorRol: {}
        }
      }
    };
  } catch (error) {
    console.error('Error en Dashboard Data:', error);
    return { success: false, error: 'Error al obtener datos reales' };
  }
};

export const getAlertasEstadisticas = async (periodo = '7d') => {
  try {
    const res = await axios.get(`${API_BASE}/api/alertas`, { headers: getHeaders() });
    const alertas = res.data.alertas || res.data;

    const tipos = {};
    alertas.forEach(a => {
      const tipo = a.tipo || 'General';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    return {
      success: true,
      data: {
        periodo,
        total: alertas.length,
        alertasPorTipo: Object.entries(tipos).map(([tipo, cantidad]) => ({ tipo, cantidad }))
      }
    };
  } catch (error) {
    return { success: false, error: 'Error en estadísticas' };
  }
};

export const getActividadReciente = async (limite = 10) => {
  try {
    const res = await axios.get(`${API_BASE}/api/alertas`, { headers: getHeaders() });
    const alertas = res.data.alertas || res.data;

    const actividades = alertas
      .sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn))
      .slice(0, limite)
      .map(a => ({
        id: a.id,
        tipo: 'alerta',
        descripcion: `Alerta en ${a.zona}`,
        timestamp: a.creadaEn,
        usuario: a.nombreUsuario,
        detalles: a.motivo
      }));

    return { success: true, data: actividades };
  } catch (error) {
    return { success: false, error: 'Error en actividad' };
  }
};
