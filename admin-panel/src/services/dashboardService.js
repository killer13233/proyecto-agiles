import axios from 'axios';
import { API_BASE } from './config';

const getToken = () => localStorage.getItem('token');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const getDashboardData = async () => {
  try {
    const results = await Promise.allSettled([
      axios.get(`${API_BASE}/api/usuarios?tamaño=1000`, { headers: getHeaders() }),
      axios.get(`${API_BASE}/api/alertas`, { headers: getHeaders() }),
      axios.get(`${API_BASE}/api/zonas`, { headers: getHeaders() })
    ]);

    const resUsuarios = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
    const resAlertas  = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
    const resZonas    = results[2].status === 'fulfilled' ? results[2].value : { data: [] };

    const usuarios = resUsuarios.data?.items || resUsuarios.data || [];
    const alertas  = Array.isArray(resAlertas.data?.alertas || resAlertas.data) 
      ? (resAlertas.data?.alertas || resAlertas.data) : [];
    const zonas    = resZonas.data?.zonas || resZonas.data || [];

    // ── Usuarios por rol ──────────────────────────────────────────
    const usuariosPorRolMap = {};
    usuarios.forEach(u => {
      const rol = u.rol || u.Rol || 'Desconocido';
      usuariosPorRolMap[rol] = (usuariosPorRolMap[rol] || 0) + 1;
    });

    // ── Alertas por motivo (tipo) ─────────────────────────────────
    const alertasPorTipoMap = {};
    alertas.forEach(a => {
      const tipo = a.motivo || a.Motivo || 'General';
      alertasPorTipoMap[tipo] = (alertasPorTipoMap[tipo] || 0) + 1;
    });

    // ── Alertas por día (últimos 7 días) ──────────────────────────
    const alertasPorDia = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const dia = fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
      const count = alertas.filter(a => {
        const f = new Date(a.creadaEn || a.CreadaEn);
        return f.toDateString() === fecha.toDateString();
      }).length;
      alertasPorDia.push({ dia, count });
    }

    // ── Alertas nuevas hoy ────────────────────────────────────────
    const hoy = new Date().toDateString();
    const nuevasHoy = alertas.filter(a => {
      const f = new Date(a.creadaEn || a.CreadaEn);
      return f.toDateString() === hoy;
    }).length;

    const resueltasHoy = alertas.filter(a => {
      const f = new Date(a.cerradaEn || a.CerradaEn);
      return f.toDateString() === hoy;
    }).length;

    return {
      success: true,
      data: {
        usuarios: {
          total: usuarios.length,
          activos:   usuarios.filter(u => u.estado === 'Activo'   || u.Estado === 'Activo').length,
          inactivos: usuarios.filter(u => u.estado !== 'Activo'   && u.Estado !== 'Activo').length,
          nuevosMes: 0,
          crecimiento: 0
        },
        alertas: {
          total:     alertas.length,
          activas:   alertas.filter(a => a.estado === 'Activa'   || a.Estado === 'Activa').length,
          asignadas: alertas.filter(a => a.estado === 'Asumida'  || a.Estado === 'Asumida').length,
          cerradas:  alertas.filter(a => a.estado === 'Cerrada'  || a.Estado === 'Cerrada').length,
          criticas:  0,
          nuevasHoy,
          resueltasHoy
        },
        zonas: {
          total:     zonas.length,
          activas:   zonas.length,
          inactivas: 0,
          nuevasMes: 0,
          cobertura: 0
        },
        actividades: alertas
          .sort((a, b) => new Date(b.creadaEn || b.CreadaEn) - new Date(a.creadaEn || a.CreadaEn))
          .slice(0, 5)
          .map(a => ({
            id:          a.id,
            tipo:        'alerta',
            descripcion: `Alerta en ${a.zona || a.Zona || 'Zona Desconocida'}`,
            timestamp:   a.creadaEn || a.CreadaEn,
            usuario:     a.nombreUsuario || a.NombreUsuario || 'Sistema',
            detalles:    `${a.motivo || a.Motivo || 'Sin descripción'} — ${a.estado || a.Estado}`
          })),
        estadisticas: {
          alertasPorDia,
          alertasPorTipo:  Object.entries(alertasPorTipoMap).map(([tipo, cantidad])  => ({ tipo, cantidad })),
          usuariosPorRol:  Object.entries(usuariosPorRolMap).map(([rol, cantidad])   => ({ rol, cantidad }))
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
    const data = res.data?.alertas || res.data || [];
    const alertas = Array.isArray(data) ? data : [];

    const tipos = {};
    alertas.forEach(a => {
      const tipo = a.motivo || a.Motivo || 'General';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    const alertasPorDia = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const dia = fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
      const count = alertas.filter(a => {
        const f = new Date(a.creadaEn || a.CreadaEn);
        return f.toDateString() === fecha.toDateString();
      }).length;
      alertasPorDia.push({ dia, count });
    }

    return {
      success: true,
      data: {
        periodo,
        total: alertas.length,
        alertasPorTipo: Object.entries(tipos).map(([tipo, cantidad]) => ({ tipo, cantidad })),
        alertasPorDia
      }
    };
  } catch (error) {
    console.error('Error en estadísticas:', error);
    return { success: false, error: 'Error en estadísticas' };
  }
};

export const getActividadReciente = async (limite = 10) => {
  try {
    const res = await axios.get(`${API_BASE}/api/alertas`, { headers: getHeaders() });
    const data = res.data?.alertas || res.data || [];
    const alertas = Array.isArray(data) ? data : [];

    const actividades = alertas
      .sort((a, b) => new Date(b.creadaEn || b.CreadaEn) - new Date(a.creadaEn || a.CreadaEn))
      .slice(0, limite)
      .map(a => ({
        id:          a.id,
        tipo:        'alerta',
        descripcion: `Alerta en ${a.zona || a.Zona || 'Zona Desconocida'}`,
        timestamp:   a.creadaEn || a.CreadaEn,
        usuario:     a.nombreUsuario || a.NombreUsuario || 'Sistema',
        detalles:    a.motivo || a.Motivo || 'Sin descripción'
      }));

    return { success: true, data: actividades };
  } catch (error) {
    console.error('Error en actividad:', error);
    return { success: false, error: 'Error en actividad' };
  }
};