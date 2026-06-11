import React, { useState, useEffect, useCallback } from 'react';
import './Actividades.css';
import { getGuardias } from '../services/usuariosService';
import { getZonas } from '../services/zonasService';
import { useAuth } from '../context/AuthContext';
import { adminWsService } from '../services/wsService';
import { API_BASE } from '../services/config';

const CATEGORIAS = [
  {
    id: "control_acceso",
    nombre: "Control de acceso",
    emoji: "🔐",
    color: "#3b82f6",
    subtipos: [
      "Verificar identificaciones de estudiantes/docentes/visitantes",
      "Registrar entradas y salidas del personal",
      "Autorizar ingreso de vehículos y asignar estacionamiento",
      "Controlar acceso a zonas restringidas",
    ],
  },
  {
    id: "vigilancia_rondas",
    nombre: "Vigilancia y rondas",
    emoji: "👁️",
    color: "#8b5cf6",
    subtipos: [
      "Recorrido periódico por instalaciones",
      "Monitoreo de cámaras de seguridad (CCTV)",
      "Verificar puertas y ventanas aseguradas",
      "Vigilar áreas con equipos de valor",
    ],
  },
  {
    id: "atencion_incidentes",
    nombre: "Atención a incidentes",
    emoji: "🚨",
    color: "#ef4444",
    subtipos: [
      "Responder a emergencias (peleas, accidentes, robos)",
      "Coordinar con Policía Nacional o servicios de emergencia",
      "Prestar primeros auxilios básicos",
      "Controlar y reportar situaciones de conflicto",
    ],
  },
  {
    id: "prevencion",
    nombre: "Prevención",
    emoji: "🛡️",
    color: "#f59e0b",
    subtipos: [
      "Detectar comportamientos sospechosos",
      "Evitar ingreso de personas no autorizadas o bajo efectos de sustancias",
      "Controlar que no ingresen armas u objetos peligrosos",
      "Prevenir hurto de equipos o bienes",
    ],
  },
  {
    id: "apoyo_logistico",
    nombre: "Apoyo logístico",
    emoji: "📋",
    color: "#10b981",
    subtipos: [
      "Registrar novedades en libro de control de turno",
      "Recibir y entregar llaves de aulas o instalaciones",
      "Orientar a visitantes sobre ubicación de oficinas",
      "Apoyar en eventos académicos (foros, graduaciones, deportivos)",
    ],
  },
  {
    id: "gestion_vehiculos",
    nombre: "Gestión de vehículos",
    emoji: "🚗",
    color: "#06b6d4",
    subtipos: [
      "Controlar salida de equipos o bienes con autorización",
      "Registrar placas de vehículos que ingresan",
      "Reportar vehículos sospechosos o mal estacionados",
    ],
  },
  {
    id: "comunicacion",
    nombre: "Comunicación",
    emoji: "📡",
    color: "#ec4899",
    subtipos: [
      "Mantener comunicación con central de seguridad",
      "Reportar novedades al jefe de seguridad o rectorado",
      "Coordinar con otros guardias el relevo de turnos",
    ],
  },
  {
    id: "personalizada",
    nombre: "Actividad personalizada",
    emoji: "✍️",
    color: "#64748b",
    subtipos: [],
  },
];

const Actividades = () => {
  const { user } = useAuth();
  const isGuard = user?.rol === 'Guardia';
  const [historial, setHistorial] = useState([]);
  const [filtroZona, setFiltroZona] = useState('Todas');
  const [busquedaGuardia, setBusquedaGuardia] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroHoraInicio, setFiltroHoraInicio] = useState('');
  const [filtroHoraFin, setFiltroHoraFin] = useState('');
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
  
  const [actividadEnCurso, setActividadEnCurso] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [observacionesTerminar, setObservacionesTerminar] = useState('');

  const fechaHoy = new Date().toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const calcularDuracion = (inicio = '', fin = '') => {
      if (!inicio || !fin) return 0;
      const [hIni, mIni] = inicio.split(':').map(Number);
      const [hFin, mFin] = fin.split(':').map(Number);
      let duracion = (hFin + (mFin || 0) / 60) - (hIni + (mIni || 0) / 60);
      if (duracion < 0) duracion += 24;
      return Math.round(duracion * 10) / 10;
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
        fecha: item.fecha || new Date().toLocaleDateString('es-EC'),
        fechaISO: item.fechaISO || new Date().toISOString(),
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

        // Restaurar actividades guardadas en localStorage
        try {
          const saved = localStorage.getItem('mis_actividades_guardia');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setHistorial(parsed);
            }
          }
          const enCurso = localStorage.getItem('actividad_en_curso_admin');
          if (enCurso) setActividadEnCurso(JSON.parse(enCurso));
        } catch (e) {
          localStorage.removeItem('mis_actividades_guardia');
          localStorage.removeItem('actividad_en_curso_admin');
        }
      } catch (error) {
        console.error("Error cargando datos para actividades", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();

    // Solo escuchar actividades que llegan en tiempo real desde el frontend
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
        categoria: data.categoriaNombre || CATEGORIAS.find(c => c.id === (data.categoriaId || data.categoria))?.nombre || (data.categoria || 'Actividad'),
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
    adminWsService.on('nueva_actividad', handleNuevaActividad);
    const handleNuevaActividadEvent = (e) => handleNuevaActividad(e.detail);
    window.addEventListener('app-nueva-ronda', handleNuevaActividadEvent);
    window.addEventListener('app-nueva-actividad', handleNuevaActividadEvent);

    return () => {
      adminWsService.on('nueva_ronda', null);
      adminWsService.on('nueva_actividad', null);
      window.removeEventListener('app-nueva-ronda', handleNuevaActividadEvent);
      window.removeEventListener('app-nueva-actividad', handleNuevaActividadEvent);
    };
  }, []);

  const handleStartActividad = (e) => {
    e.preventDefault();
    if (!newActividad.zona || !newActividad.inicio || !newActividad.categoriaId || !newActividad.subtipo) return;

    // Validar que la hora de inicio no sea anterior a la hora actual
    const horaActual = new Date().toTimeString().slice(0, 5);
    if (newActividad.inicio < horaActual) {
      alert('La hora de inicio no puede ser anterior a la hora actual (' + horaActual + ').');
      return;
    }

    const cat = CATEGORIAS.find(c => c.id === newActividad.categoriaId);

    const nuevaActividadObj = {
      zona: newActividad.zona,
      guardia: user?.nombre || 'Guardia',
      inicio: newActividad.inicio,
      fin: '',
      categoriaId: newActividad.categoriaId,
      categoriaNombre: cat?.nombre || 'Actividad',
      subtipo: newActividad.subtipo,
      observaciones: ''
    };

    setActividadEnCurso(nuevaActividadObj);
    localStorage.setItem('actividad_en_curso_admin', JSON.stringify(nuevaActividadObj));

    setShowAddModal(false);
    setNewActividad({ categoriaId: '', subtipo: '', zona: user?.zonaAsignada || '', observaciones: '', inicio: '', fin: '' });
  };

  const handleFinishActividad = (e) => {
    e.preventDefault();
    if (!actividadEnCurso) return;

    let horaActualStr = new Date().toTimeString().slice(0, 5);
    if (horaActualStr < actividadEnCurso.inicio) {
      horaActualStr = actividadEnCurso.inicio;
    }

    const [hIni, mIni] = actividadEnCurso.inicio.split(':').map(Number);
    const [hFin, mFin] = horaActualStr.split(':').map(Number);
    let duracion = (hFin + (mFin || 0) / 60) - (hIni + (mIni || 0) / 60);
    if (duracion < 0) duracion += 24;
    duracion = Math.round(duracion * 10) / 10;

    const nueva = {
      id: Date.now(),
      zona: actividadEnCurso.zona,
      guardia: actividadEnCurso.guardia,
      inicio: actividadEnCurso.inicio,
      fin: horaActualStr,
      duracion: duracion,
      categoriaId: actividadEnCurso.categoriaId,
      categoria: actividadEnCurso.categoriaNombre,
      subtipo: actividadEnCurso.subtipo,
      observaciones: observacionesTerminar,
      fecha: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
      fechaISO: new Date().toISOString()
    };

    setHistorial(prev => {
      const next = [...prev, nueva].sort((a, b) => a.inicio.localeCompare(b.inicio));
      localStorage.setItem('mis_actividades_guardia', JSON.stringify(next));
      return next;
    });

    // Enviar por WebSocket
    adminWsService.send({
      tipo: "nueva_actividad",
      guardia: nueva.guardia,
      categoriaId: nueva.categoriaId,
      categoriaNombre: nueva.categoria,
      subtipo: nueva.subtipo,
      zona: nueva.zona,
      observaciones: nueva.observaciones,
      horaInicio: nueva.inicio,
      horaFin: nueva.fin,
      fecha: nueva.fecha,
      fechaISO: nueva.fechaISO,
    });

    setActividadEnCurso(null);
    localStorage.removeItem('actividad_en_curso_admin');
    setObservacionesTerminar('');
    setShowFinishModal(false);
    alert('✅ Actividad finalizada y registrada correctamente.');
  };

  const getZoneClass = (zona) => {
    // Basic dynamic coloring based on zone name
    const hash = zona.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variants = ['zone-a', 'zone-b', 'zone-c', 'zone-d'];
    return `zone-tag-dark ${variants[hash % variants.length]}`;
  };

  // Filtrado de historial
  const historialFiltrado = historial.filter(item => {
    // Protección contra undefined/null
    if (!item) return false;

    // 1. Zona
    const fZona = String(filtroZona || '').trim();
    const iZona = String(item.zona || '').trim();
    const coincideZona = fZona === 'Todas' || iZona === fZona;

    // 2. Guardia
    const fGuardia = String(busquedaGuardia || '').trim().toLowerCase();
    const iGuardia = String(item.guardia || '').trim().toLowerCase();
    const coincideGuardia = iGuardia.includes(fGuardia);

    // 3. Categoría
    const fCat = String(filtroCategoria || '').trim();
    const iCatId = String(item.categoriaId || '').trim();
    const iCat = String(item.categoria || '').trim();
    const coincideCategoria = fCat === 'Todas' || iCatId === fCat || iCat === fCat;
    
    // 4. Fechas
    let coincideFecha = true;
    if (filtroFechaInicio || filtroFechaFin) {
      const fInicio = filtroFechaInicio ? String(filtroFechaInicio) : '';
      const fFin = filtroFechaFin ? String(filtroFechaFin) : '';
      const itemDateStr = item.fechaISO ? String(item.fechaISO).split('T')[0] : '';
      
      if (itemDateStr) {
        if (fInicio && itemDateStr < fInicio) coincideFecha = false;
        if (fFin && itemDateStr > fFin) coincideFecha = false;
      }
    }

    // 5. Horas
    let coincideHora = true;
    const fHoraIni = String(filtroHoraInicio || '').trim();
    const fHoraFin = String(filtroHoraFin || '').trim();
    const iInicio = String(item.inicio || '').trim();
    const iFin = String(item.fin || '').trim();

    if (fHoraIni && iInicio && iInicio < fHoraIni) coincideHora = false;
    if (fHoraFin && iFin && iFin > fHoraFin) coincideHora = false;

    return coincideZona && coincideGuardia && coincideCategoria && coincideFecha && coincideHora;
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
            <p className="act-subtitle">Historial y control de actividades por guardia y zona</p>
          </div>
          {isGuard && (
            !actividadEnCurso ? (
              <button className="btn-primary-dark btn-add-ronda" onClick={() => {
                const horaActual = new Date().toTimeString().slice(0, 5);
                setNewActividad(prev => ({ ...prev, inicio: horaActual }));
                setShowAddModal(true);
              }}>
                + Añadir Actividad
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '8px 16px', borderRadius: '8px' }}>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>En curso: {actividadEnCurso.subtipo}</span>
                <button className="btn-primary-dark" style={{ backgroundColor: '#ef4444', padding: '8px 12px' }} onClick={() => setShowFinishModal(true)}>
                  ⏹️ Terminar Actividad
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-dark">
        <div className="summary-card-dark">
          <span className="summary-label-dark">Horas Registradas</span>
          <div className="summary-value-dark">
            {totalHoras} <span className="summary-value-sub">horas</span>
          </div>
        </div>
        <div className="summary-card-dark blocks">
          <span className="summary-label-dark">Actividades Encontradas</span>
          <div className="summary-value-dark">
            {totalBloques} <span className="summary-value-sub">actividades</span>
          </div>
        </div>
      </div>

      {/* Main Grid - Ahora es full width para lectura */}
      <div className="act-registry-container">
        
        {/* Barra de Filtros */}
        <div className="filters-bar-dark" style={{gap: '1.5rem'}}>
          <div style={{display: 'flex', gap: '1.5rem', width: '100%', flexWrap: 'wrap'}}>
            <div className="filter-group" style={{minWidth: '200px'}}>
              <label className="filter-label">Buscar Guardia</label>
              <input 
                type="text" 
                className="filter-input"
                placeholder="Ej. Rodríguez..."
                value={busquedaGuardia}
                onChange={(e) => setBusquedaGuardia(e.target.value)}
              />
            </div>
            
            <div className="filter-group" style={{minWidth: '200px', flex: 1}}>
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

            <div className="filter-group" style={{minWidth: '200px'}}>
              <label className="filter-label">Tipo de Actividad</label>
              <select className="filter-input" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="Todas">Todas las actividades</option>
                {CATEGORIAS.map(cat => <option key={cat.id} value={cat.id}>{cat.emoji} {cat.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{display: 'flex', gap: '1.5rem', width: '100%', flexWrap: 'wrap'}}>
            <div className="filter-group" style={{minWidth: '150px', flex: 1}}>
              <label className="filter-label">Fecha Inicio</label>
              <input type="date" className="filter-input" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} />
            </div>
            <div className="filter-group" style={{minWidth: '150px', flex: 1}}>
              <label className="filter-label">Fecha Fin</label>
              <input type="date" className="filter-input" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} />
            </div>
            <div className="filter-group" style={{minWidth: '150px', flex: 1}}>
              <label className="filter-label">Hora Mínima (Inicio)</label>
              <input type="time" className="filter-input" value={filtroHoraInicio} onChange={(e) => setFiltroHoraInicio(e.target.value)} />
            </div>
            <div className="filter-group" style={{minWidth: '150px', flex: 1}}>
              <label className="filter-label">Hora Máxima (Fin)</label>
              <input type="time" className="filter-input" value={filtroHoraFin} onChange={(e) => setFiltroHoraFin(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Historial (Vista Ancha) */}
        <div className="act-card-dark full-width">
          <h2 className="act-card-title-dark">
            <span>Actividades Registradas</span>
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
                No se encontraron actividades. Asegúrate de tener guardias y zonas en la base de datos.
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
                    
                    <div className="history-activity-dark" style={{marginTop: '10px'}}>
                      <div style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)'}}>
                        {CATEGORIAS.find(c => c.id === item.categoriaId)?.emoji || "📝"} {item.categoria}
                      </div>
                      <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px'}}>{item.subtipo}</div>
                      {item.observaciones && (
                        <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px'}}>
                          💬 {item.observaciones}
                        </div>
                      )}
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

      {/* Modal for Adding Actividad */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Añadir Nueva Actividad</h2>
            <form onSubmit={handleStartActividad}>
              <div className="modal-form-group">
                <label className="modal-label">Categoría</label>
                <select 
                  className="modal-input"
                  value={newActividad.categoriaId}
                  onChange={(e) => setNewActividad({...newActividad, categoriaId: e.target.value, subtipo: ''})}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {CATEGORIAS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Tipo de Actividad</label>
                <input 
                  list={`subtipos-${newActividad.categoriaId}`}
                  className="modal-input"
                  placeholder="Escribe o selecciona un tipo..."
                  value={newActividad.subtipo}
                  onChange={(e) => setNewActividad({...newActividad, subtipo: e.target.value})}
                  required
                  disabled={!newActividad.categoriaId}
                />
                <datalist id={`subtipos-${newActividad.categoriaId}`}>
                  {newActividad.categoriaId && CATEGORIAS.find(c => c.id === newActividad.categoriaId)?.subtipos.map(sub => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Zona</label>
                <select 
                  className="modal-input"
                  value={newActividad.zona}
                  onChange={(e) => setNewActividad({...newActividad, zona: e.target.value})}
                  required
                >
                  <option value="">Seleccione una zona</option>
                  {zonasOptions.filter(z => z !== 'Todas').map(zona => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <div className="modal-form-group" style={{flex: 1}}>
                  <label className="modal-label">Hora Inicio</label>
                  <input 
                    type="time"
                    className="modal-input"
                    value={newActividad.inicio}
                    onChange={(e) => setNewActividad({...newActividad, inicio: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary-dark" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-dark">
                  Iniciar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Terminar Actividad */}
      {showFinishModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">⏹️ Terminar Actividad</h2>
            <form onSubmit={handleFinishActividad}>
              <div className="modal-form-group">
                <label className="modal-label">Novedades / Observaciones</label>
                <textarea 
                  className="modal-input"
                  value={observacionesTerminar}
                  onChange={(e) => setObservacionesTerminar(e.target.value)}
                  rows="4"
                  placeholder="Escribe las novedades ocurridas durante la actividad..."
                  style={{resize: 'none', fontFamily: 'inherit'}}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary-dark" onClick={() => setShowFinishModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-dark" style={{ backgroundColor: '#ef4444' }}>
                  Finalizar y Guardar
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
