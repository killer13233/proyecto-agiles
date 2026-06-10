import React, { useState, useEffect, useCallback } from 'react';
import './Actividades.css';
import { getGuardias } from '../services/usuariosService';
import { getZonas } from '../services/zonasService';
import { useAuth } from '../context/AuthContext';
import { adminWsService } from '../services/wsService';
import { API_BASE } from '../services/config';

const CATEGORIAS = [
  {
    id: 'control_acceso',
    nombre: 'Control de acceso',
    subtipos: [
      'Verificar identificaciones de estudiantes/docentes/visitantes',
      'Registrar entradas y salidas del personal',
      'Autorizar ingreso de vehículos y asignar estacionamiento',
      'Controlar acceso a zonas restringidas',
    ],
  },
  {
    id: 'vigilancia_rondas',
    nombre: 'Vigilancia y rondas',
    subtipos: [
      'Recorrido periódico por instalaciones',
      'Monitoreo de cámaras de seguridad (CCTV)',
      'Verificar puertas y ventanas aseguradas',
      'Vigilar áreas con equipos de valor',
    ],
  },
  {
    id: 'atencion_incidentes',
    nombre: 'Atención a incidentes',
    subtipos: [
      'Responder a emergencias (peleas, accidentes, robos)',
      'Coordinar con Policía Nacional o servicios de emergencia',
      'Prestar primeros auxilios básicos',
      'Controlar y reportar situaciones de conflicto',
    ],
  },
  {
    id: 'prevencion',
    nombre: 'Prevención',
    subtipos: [
      'Detectar comportamientos sospechosos',
      'Evitar ingreso de personas no autorizadas o bajo efectos de sustancias',
      'Controlar que no ingresen armas u objetos peligrosos',
      'Prevenir hurto de equipos o bienes',
    ],
  },
  {
    id: 'apoyo_logistico',
    nombre: 'Apoyo logístico',
    subtipos: [
      'Registrar novedades en libro de control de turno',
      'Recibir y entregar llaves de aulas o instalaciones',
      'Orientar a visitantes sobre ubicación de oficinas',
      'Apoyar en eventos académicos (foros, graduaciones, deportivos)',
    ],
  },
  {
    id: 'gestion_vehiculos',
    nombre: 'Gestión de vehículos',
    subtipos: [
      'Controlar salida de equipos o bienes con autorización',
      'Registrar placas de vehículos que ingresan',
      'Reportar vehículos sospechosos o mal estacionados',
    ],
  },
  {
    id: 'comunicacion',
    nombre: 'Comunicación',
    subtipos: [
      'Mantener comunicación con central de seguridad',
      'Reportar novedades al jefe de seguridad o rectorado',
      'Coordinar con otros guardias el relevo de turnos',
    ],
  },
];

const Actividades = () => {
  const { user } = useAuth();
  const isGuard = user?.rol === 'Guardia';
  const [historial, setHistorial] = useState([]);
  const [filtroZona, setFiltroZona] = useState('Todas');
  const [busquedaGuardia, setBusquedaGuardia] = useState('');
  const [zonasOptions, setZonasOptions] = useState(['Todas']);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newActividad, setNewActividad] = useState({
    categoriaId: '',
    subtipo: '',
    zona: user?.zonaAsignada || '',
    observaciones: '',
    inicio: '',
    fin: '',
  });

  const fechaHoy = new Date().toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const calcularDuracion = (inicio = '', fin = '') => {
      if (!inicio || !fin) return 0;
      const [hIni] = inicio.split(':').map(Number);
      const [hFin] = fin.split(':').map(Number);
      let duracion = hFin - hIni;
      if (duracion <= 0) duracion += 24;
      return duracion;
    };

    const parseActividad = (item) => {
      const inicio = item.horaInicio || item.inicio || '';
      const fin = item.horaFin || item.fin || '';
      const categoriaId = item.categoriaId || item.categoria || '';
      const categoria = item.categoriaNombre || CATEGORIAS.find(c => c.id === categoriaId)?.nombre || categoriaId || item.categoria || 'Ronda';
      return {
        id: item.id ?? Date.now() + Math.random(),
        zona: item.zona || '',
        guardia: item.guardia || 'Guardia',
        inicio,
        fin,
        duracion: item.duracion ?? calcularDuracion(inicio, fin),
        categoriaId,
        categoria,
        subtipo: item.subtipo || '',
        observaciones: item.observaciones || '',
        fecha: item.fecha || '',
        fechaISO: item.fechaISO || '',
      };
    };

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [resGuardias, resZonas] = await Promise.all([
          getGuardias(),
          getZonas()
        ]);

        const zonasDb = resZonas.success ? resZonas.data : [];
        const zonasNombres = zonasDb.map(z => z.nombre);
        setZonasOptions(['Todas', ...zonasNombres]);

        const savedActividades = JSON.parse(localStorage.getItem('mis_actividades_guardia') || '[]');
        const savedRondas = JSON.parse(localStorage.getItem('rondas_mock_db') || '[]');
        const merged = [...savedActividades, ...savedRondas];
        const normalized = merged
          .map(parseActividad)
          .sort((a, b) => a.inicio.localeCompare(b.inicio));

        setHistorial(normalized);
      } catch (error) {
        console.error("Error cargando datos para actividades", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();

    const handleNuevaActividad = (data) => {
      console.log('Nueva actividad recibida via WS:', data);
      const actividad = {
        id: Date.now() + Math.random(),
        zona: data.zona || '',
        guardia: data.guardia || 'Guardia',
        inicio: data.inicio || data.horaInicio || '',
        fin: data.fin || data.horaFin || '',
        duracion: calcularDuracion(data.inicio || data.horaInicio || '', data.fin || data.horaFin || ''),
        categoriaId: data.categoriaId || data.categoria || '',
        categoria: data.categoriaNombre || CATEGORIAS.find(c => c.id === (data.categoriaId || data.categoria))?.nombre || (data.categoria || 'Ronda'),
        subtipo: data.subtipo || '',
        observaciones: data.observaciones || '',
        fecha: data.fecha || '',
        fechaISO: data.fechaISO || new Date().toISOString(),
      };

      setHistorial(prev => {
        const yaExiste = prev.some(
          r => r.zona === actividad.zona &&
               r.guardia === actividad.guardia &&
               r.inicio === actividad.inicio &&
               r.fin === actividad.fin
        );
        if (yaExiste) return prev;

        const next = [...prev, actividad].sort((a, b) => a.inicio.localeCompare(b.inicio));
        localStorage.setItem('mis_actividades_guardia', JSON.stringify(next));
        return next;
      });
    };

    adminWsService.on('nueva_ronda', handleNuevaActividad);
    const handleNuevaActividadEvent = (e) => handleNuevaActividad(e.detail);
    window.addEventListener('app-nueva-ronda', handleNuevaActividadEvent);
    window.addEventListener('app-nueva-actividad', handleNuevaActividadEvent);

    const fetchActividadesRest = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/alertas/rondas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        setHistorial(prev => {
          let updated = [...prev];
          for (const r of data) {
            const yaExiste = updated.some(
              x => x.zona === r.zona && x.guardia === r.guardia &&
                   x.inicio === (r.inicio || r.horaInicio) && x.fin === (r.fin || r.horaFin)
            );
            if (!yaExiste) {
              const actividad = parseActividad(r);
              updated.push(actividad);
            }
          }
          updated.sort((a, b) => a.inicio.localeCompare(b.inicio));
          localStorage.setItem('mis_actividades_guardia', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.warn('[Actividades] Error polling REST:', err);
      }
    };
    const interval = setInterval(fetchActividadesRest, 10000);

    return () => {
      adminWsService.on('nueva_ronda', null);
      window.removeEventListener('app-nueva-ronda', handleNuevaActividadEvent);
      window.removeEventListener('app-nueva-actividad', handleNuevaActividadEvent);
      clearInterval(interval);
    };
  }, []);

  const handleAddRonda = (e) => {
    e.preventDefault();
    if (!newRonda.zona || !newRonda.inicio || !newRonda.fin) return;

    // Validar que la hora de inicio no sea anterior a la hora actual
    const horaActual = new Date().toTimeString().slice(0, 5);
    if (newRonda.inicio < horaActual) {
      alert('La hora de inicio no puede ser anterior a la hora actual (' + horaActual + ').');
      return;
    }

    const [hIni] = newRonda.inicio.split(':').map(Number);
    const [hFin] = newRonda.fin.split(':').map(Number);
    let duracion = hFin - hIni;
    if (duracion <= 0) duracion += 24;

    const nuevaRondaObj = {
      id: Date.now(),
      zona: newRonda.zona,
      guardia: user?.nombre || 'Guardia',
      inicio: newRonda.inicio,
      fin: newRonda.fin,
      duracion: duracion
    };

    setHistorial(prev => {
      const next = [...prev, nuevaRondaObj].sort((a, b) => a.inicio.localeCompare(b.inicio));
      localStorage.setItem('rondas_mock_db', JSON.stringify(next));
      return next;
    });
    setShowAddModal(false);
    setNewRonda({ zona: user?.zonaAsignada || '', inicio: '', fin: '' });
  };

  const getZoneClass = (zona) => {
    // Basic dynamic coloring based on zone name
    const hash = zona.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variants = ['zone-a', 'zone-b', 'zone-c', 'zone-d'];
    return `zone-tag-dark ${variants[hash % variants.length]}`;
  };

  // Filtrado de historial
  const historialFiltrado = historial.filter(item => {
    const coincideZona = filtroZona === 'Todas' || item.zona === filtroZona;
    const coincideGuardia = item.guardia.toLowerCase().includes(busquedaGuardia.toLowerCase());
    return coincideZona && coincideGuardia;
  });

  const totalHoras = historialFiltrado.reduce((sum, item) => sum + item.duracion, 0);
  const totalBloques = historialFiltrado.length;

  return (
    <div className="actividades-page">

      {/* Header */}
      <div className="act-header-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="act-title">Registro de Actividades</h1>
            <p className="act-subtitle">Historial y control de coberturas de rondas por guardia y zona</p>
          </div>
          {isGuard && (
            <button className="btn-primary-dark btn-add-ronda" onClick={() => setShowAddModal(true)}>
              + Añadir Ronda
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-dark">
        <div className="summary-card-dark">
          <span className="summary-label-dark">Horas Filtradas</span>
          <div className="summary-value-dark">
            {totalHoras} <span className="summary-value-sub">horas</span>
          </div>
        </div>
        <div className="summary-card-dark blocks">
          <span className="summary-label-dark">Rondas Encontradas</span>
          <div className="summary-value-dark">
            {totalBloques} <span className="summary-value-sub">rondas</span>
          </div>
        </div>
      </div>

      {/* Main Grid - Ahora es full width para lectura */}
      <div className="act-registry-container">
        
        {/* Barra de Filtros */}
        <div className="filters-bar-dark">
          <div className="filter-group">
            <label className="filter-label">Buscar Guardia</label>
            <input 
              type="text" 
              className="filter-input"
              placeholder="Ej. Rodríguez..."
              value={busquedaGuardia}
              onChange={(e) => setBusquedaGuardia(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Filtrar por Zona</label>
            <div className="zone-filters">
              {zonasOptions.map(zona => (
                <button
                  key={zona}
                  className={`zone-filter-btn ${filtroZona === zona ? 'active' : ''}`}
                  onClick={() => setFiltroZona(zona)}
                >
                  {zona}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Historial (Vista Ancha) */}
        <div className="act-card-dark full-width">
          <h2 className="act-card-title-dark">
            <span>Rondas Ejecutadas</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
              {fechaHoy}
            </span>
          </h2>

          <div className="history-grid-dark">
            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0', gridColumn: '1 / -1' }}>
                Cargando datos desde la BD...
              </p>
            ) : historialFiltrado.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0', gridColumn: '1 / -1' }}>
                No se encontraron rondas. Asegúrate de tener guardias y zonas en la base de datos.
              </p>
            ) : (
              historialFiltrado.map(item => (
                <div key={item.id} className="history-item-dark card-layout">
                  <div className="history-card-header">
                    <div className={getZoneClass(item.zona)}>
                      {item.zona}
                    </div>
                    <span className="history-range-dark">{item.inicio} - {item.fin}</span>
                  </div>

                  <div className="history-card-body">
                    <div className="history-guard-dark">
                      <span className="history-guard-label">Guardia responsable</span>
                      <span className="history-guard-name">{item.guardia}</span>
                    </div>
                  </div>

                  <div className="history-card-footer">
                    <span className="history-duration-dark">Duración: {item.duracion}h</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal for Adding Round */}
      {showAddModal && (
        <div className="modal-overlay-dark">
          <div className="modal-content-dark">
            <h3 className="modal-title-dark">Añadir Nueva Ronda</h3>
            <form onSubmit={handleAddRonda}>
              <div className="modal-form-group">
                <label className="modal-label">Zona</label>
                <select 
                  className="modal-input"
                  value={newRonda.zona}
                  onChange={(e) => setNewRonda({...newRonda, zona: e.target.value})}
                  required
                >
                  <option value="">Seleccione una zona</option>
                  {zonasOptions.filter(z => z !== 'Todas').map(zona => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Hora Inicio</label>
                <input 
                  type="time"
                  className="modal-input"
                  value={newRonda.inicio}
                  min={new Date().toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const horaActual = new Date().toTimeString().slice(0, 5);
                    if (e.target.value < horaActual) {
                      alert('La hora de inicio no puede ser anterior a la hora actual (' + horaActual + ').');
                      setNewRonda({...newRonda, inicio: horaActual});
                      return;
                    }
                    setNewRonda({...newRonda, inicio: e.target.value});
                  }}
                  required
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Hora Fin</label>
                <input 
                  type="time"
                  className="modal-input"
                  value={newRonda.fin}
                  onChange={(e) => setNewRonda({...newRonda, fin: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary-dark" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-dark">
                  Guardar Ronda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actividades;
