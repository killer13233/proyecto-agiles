import axios from 'axios';
import { API_BASE } from './config';

const getToken = () => localStorage.getItem('token');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const isSameUTCDay = (a, b) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

const utcToday = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const utcDaysAgo = (n) => {
  const d = utcToday();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

/**
 * Check if a date falls within a given range [start, end] inclusive.
 * If start/end are null, that bound is open.
 */
const isInRange = (date, start, end) => {
  if (!date) return false;
  if (start && date < start) return false;
  if (end) {
    // end is inclusive — set end to end-of-day
    const endOfDay = new Date(end);
    endOfDay.setUTCHours(23, 59, 59, 999);
    if (date > endOfDay) return false;
  }
  return true;
};

/**
 * Generate an array of day labels between two dates.
 */
const generateDayLabels = (start, end) => {
  const days = [];
  const current = new Date(start);
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
};

/**
 * Main dashboard data fetcher.
 * @param {Object} filtro - Optional date filter
 * @param {Date|null} filtro.fechaInicio - Start date (inclusive)
 * @param {Date|null} filtro.fechaFin - End date (inclusive)
 */
export const getDashboardData = async (filtro = {}) => {
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
    const alertasRaw = Array.isArray(resAlertas.data?.alertas || resAlertas.data)
      ? (resAlertas.data?.alertas || resAlertas.data) : [];
    const zonas    = resZonas.data?.zonas || resZonas.data || [];

    // All alerts (unfiltered) for global counters
    const todasAlertas = alertasRaw;

    // ── Apply date range filter ─────────────────────────────────────
    const { fechaInicio, fechaFin } = filtro;
    const tieneRango = fechaInicio || fechaFin;

    const alertasFiltradas = tieneRango
      ? todasAlertas.filter(a => {
          const f = toDate(a.creadaEn || a.CreadaEn);
          return isInRange(f, fechaInicio, fechaFin);
        })
      : todasAlertas;

    // Use filtered alerts for statistics
    const alertas = alertasFiltradas;

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

    // ── Alertas por zona ──────────────────────────────────────────
    const alertasPorZonaMap = {};
    alertas.forEach(a => {
      const zona = a.zona || a.Zona || 'Desconocida';
      alertasPorZonaMap[zona] = (alertasPorZonaMap[zona] || 0) + 1;
    });

    // ── Alertas por día ───────────────────────────────────────────
    // If there's a date range, show all days in that range.
    // Otherwise default to the last 7 days.
    let alertasPorDia = [];
    if (tieneRango) {
      const start = fechaInicio || utcDaysAgo(30);
      const end = fechaFin || utcToday();
      const dayLabels = generateDayLabels(start, end);

      // If range is too long, group by week/month
      if (dayLabels.length > 60) {
        // Group by month
        const monthMap = {};
        // Initialize chronologically
        let currentMonthDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
        const endMonthDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
        while (currentMonthDate <= endMonthDate) {
          const key = currentMonthDate.toLocaleDateString('es-EC', { month: 'short', year: '2-digit', timeZone: 'UTC' });
          monthMap[key] = { dia: key, count: 0 };
          currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() + 1);
        }

        alertas.forEach(a => {
          const f = toDate(a.creadaEn || a.CreadaEn);
          if (f && isInRange(f, start, end)) {
            const key = f.toLocaleDateString('es-EC', { month: 'short', year: '2-digit', timeZone: 'UTC' });
            if (monthMap[key]) {
              monthMap[key].count++;
            }
          }
        });
        alertasPorDia = Object.values(monthMap);
      } else if (dayLabels.length > 14) {
        // Group by week
        const weekMap = {};
        dayLabels.forEach((d, i) => {
          const weekNum = Math.floor(i / 7);
          const weekLabel = `Sem ${weekNum + 1}`;
          if (!weekMap[weekLabel]) weekMap[weekLabel] = { dia: weekLabel, count: 0 };
        });
        alertas.forEach(a => {
          const f = toDate(a.creadaEn || a.CreadaEn);
          if (f && isInRange(f, start, end)) {
            const daysSinceStart = Math.floor((f - start) / 86400000);
            const weekNum = Math.floor(daysSinceStart / 7);
            const weekLabel = `Sem ${weekNum + 1}`;
            if (!weekMap[weekLabel]) weekMap[weekLabel] = { dia: weekLabel, count: 0 };
            weekMap[weekLabel].count++;
          }
        });
        alertasPorDia = Object.values(weekMap);
      } else {
        // Day by day
        alertasPorDia = dayLabels.map(fecha => {
          const dia = fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', timeZone: 'UTC' });
          const count = alertas.filter(a => {
            const f = toDate(a.creadaEn || a.CreadaEn);
            return f && isSameUTCDay(f, fecha);
          }).length;
          return { dia, count };
        });
      }
    } else {
      // Default: last 7 days
      for (let i = 6; i >= 0; i--) {
        const fecha = utcDaysAgo(i);
        const dia = fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', timeZone: 'UTC' });
        const count = alertas.filter(a => {
          const f = toDate(a.creadaEn || a.CreadaEn);
          return f && isSameUTCDay(f, fecha);
        }).length;
        alertasPorDia.push({ dia, count });
      }
    }

    // ── Tiempo promedio de resolución (filtered) ──────────────────
    const alertasResueltas = alertas.filter(a => (a.cerradaEn || a.CerradaEn) && (a.creadaEn || a.CreadaEn));
    let tiempoResolucionMin = null;
    if (alertasResueltas.length > 0) {
      const totalMs = alertasResueltas.reduce((sum, a) => {
        const creada = toDate(a.creadaEn || a.CreadaEn);
        const cerrada = toDate(a.cerradaEn || a.CerradaEn);
        return sum + (cerrada - creada);
      }, 0);
      tiempoResolucionMin = Math.round(totalMs / alertasResueltas.length / 60000);
    }

    // ── Alertas nuevas hoy (always today, unfiltered) ─────────────
    const hoy = utcToday();
    const nuevasHoy = todasAlertas.filter(a => {
      const f = toDate(a.creadaEn || a.CreadaEn);
      return f && isSameUTCDay(f, hoy);
    }).length;

    const resueltasHoy = todasAlertas.filter(a => {
      const f = toDate(a.cerradaEn || a.CerradaEn);
      return f && isSameUTCDay(f, hoy);
    }).length;

    // ── Alertas por estado (filtered) ─────────────────────────────
    const alertasActivas = alertas.filter(a => a.estado === 'Activa' || a.Estado === 'Activa').length;
    const alertasAsignadas = alertas.filter(a => a.estado === 'Asumida' || a.Estado === 'Asumida').length;
    const alertasCerradas = alertas.filter(a => a.estado === 'Cerrada' || a.Estado === 'Cerrada').length;
    const alertasCriticas = alertas.filter(a => (a.prioridad || a.Prioridad) === 'Crítica').length;

    // ── Rate of change vs previous period ─────────────────────────
    let tasaCambio = null;
    if (tieneRango && fechaInicio && fechaFin) {
      const rangoMs = fechaFin - fechaInicio;
      const prevInicio = new Date(fechaInicio.getTime() - rangoMs);
      const prevFin = new Date(fechaInicio.getTime() - 1);
      const alertasPeriodoAnterior = todasAlertas.filter(a => {
        const f = toDate(a.creadaEn || a.CreadaEn);
        return isInRange(f, prevInicio, prevFin);
      }).length;
      if (alertasPeriodoAnterior > 0) {
        tasaCambio = Math.round(((alertas.length - alertasPeriodoAnterior) / alertasPeriodoAnterior) * 100);
      }
    }

    // ── Top Usuarios y Guardias ───────────────────────────────────
    const extraerGuardiasIds = (raw) => {
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed.filter(id => id && String(id).trim() !== '') : [];
      } catch { return []; }
    };

    const usuariosAlertasCount = {};
    const guardiasAlertasCount = {};

    alertas.forEach(a => {
      const uName = a.nombreUsuario || a.NombreUsuario || 'Desconocido';
      usuariosAlertasCount[uName] = (usuariosAlertasCount[uName] || 0) + 1;

      const gIds = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
      gIds.forEach(id => {
        const u = usuarios.find(usr => String(usr.id) === String(id));
        const gName = u ? (u.nombre || u.Nombre || `Guardia ${id}`) : `Guardia ID: ${id}`;
        guardiasAlertasCount[gName] = (guardiasAlertasCount[gName] || 0) + 1;
      });
    });

    const topUsuarios = Object.entries(usuariosAlertasCount)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const topGuardias = Object.entries(guardiasAlertasCount)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // ── Alertas por Hora ──────────────────────────────────────────
    const alertasPorHora = Array.from({ length: 24 }, (_, i) => ({ hora: `${String(i).padStart(2, '0')}:00`, count: 0 }));
    
    // ── Alertas por Día de la Semana ──────────────────────────────
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const alertasPorDiaSemana = diasSemana.map(dia => ({ dia, count: 0 }));
    
    // ── Tiempo de Resolución por Guardia ──────────────────────────
    const tiemposResolucionGuardias = {};

    alertas.forEach(a => {
      const f = toDate(a.creadaEn || a.CreadaEn);
      if (f) {
        alertasPorHora[f.getHours()].count++;
        alertasPorDiaSemana[f.getDay()].count++;
      }

      const cierre = toDate(a.cerradaEn || a.CerradaEn);
      if (f && cierre && (a.estado === 'Cerrada' || a.Estado === 'Cerrada')) {
        const timeDiffMins = (cierre - f) / 60000;
        const gIds = extraerGuardiasIds(a.guardiasInvolucrados || a.GuardiasInvolucrados);
        gIds.forEach(id => {
          const u = usuarios.find(usr => String(usr.id) === String(id));
          const gName = u ? (u.nombre || u.Nombre || `Guardia ${id}`) : `Guardia ID: ${id}`;
          if (!tiemposResolucionGuardias[gName]) tiemposResolucionGuardias[gName] = { sum: 0, count: 0 };
          tiemposResolucionGuardias[gName].sum += timeDiffMins;
          tiemposResolucionGuardias[gName].count++;
        });
      }
    });

    const tiempoResolucionGuardias = Object.entries(tiemposResolucionGuardias)
      .map(([nombre, stats]) => ({
        nombre,
        tiempoPromedio: Math.round(stats.sum / stats.count)
      }))
      .sort((a, b) => a.tiempoPromedio - b.tiempoPromedio)
      .slice(0, 5);

    return {
      success: true,
      data: {
        usuarios: {
          total: usuarios.length,
          activos:   usuarios.filter(u => u.estado === 'Activo'   || u.Estado === 'Activo').length,
          inactivos: usuarios.filter(u => (u.estado === 'Inactivo' || u.Estado === 'Inactivo')).length,
          bloqueados: usuarios.filter(u => (u.estado === 'Bloqueado' || u.Estado === 'Bloqueado')).length,
          nuevosMes: 0,
          crecimiento: 0
        },
        alertas: {
          total:     alertas.length,
          totalGlobal: todasAlertas.length,
          activas:   alertasActivas,
          asignadas: alertasAsignadas,
          cerradas:  alertasCerradas,
          criticas:  alertasCriticas,
          nuevasHoy,
          resueltasHoy,
          tiempoResolucionMin,
          tasaCambio
        },
        zonas: {
          total:     zonas.length,
          activas:   zonas.length,
          inactivas: 0,
          nuevasMes: 0,
          cobertura: 0
        },
        todasLasAlertas: alertas,
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
          alertasPorZona:  Object.entries(alertasPorZonaMap)
            .map(([zona, cantidad]) => ({ zona, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 8),
          usuariosPorRol:  Object.entries(usuariosPorRolMap).map(([rol, cantidad])   => ({ rol, cantidad })),
          topUsuarios,
          topGuardias,
          alertasPorHora,
          alertasPorDiaSemana,
          tiempoResolucionGuardias
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
      const fecha = utcDaysAgo(i);
      const dia = fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', timeZone: 'UTC' });
      const count = alertas.filter(a => {
        const f = toDate(a.creadaEn || a.CreadaEn);
        return f && isSameUTCDay(f, fecha);
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