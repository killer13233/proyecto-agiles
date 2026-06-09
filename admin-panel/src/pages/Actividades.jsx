import React, { useState, useEffect, useCallback } from 'react';
import './Actividades.css';
import { getGuardias } from '../services/usuariosService';
import { getZonas } from '../services/zonasService';
import { useAuth } from '../context/AuthContext';
import { adminWsService } from '../services/wsService';
import { API_BASE } from '../services/config';

const Actividades = () => {
  const { user } = useAuth();
  const isGuard = user?.rol === 'Guardia';
  const [historial, setHistorial] = useState([]);
  const [filtroZona, setFiltroZona] = useState('Todas');
  const [busquedaGuardia, setBusquedaGuardia] = useState('');
  const [zonasOptions, setZonasOptions] = useState(['Todas']);
  const [loading, setLoading] = useState(true);

  // Add round state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRonda, setNewRonda] = useState({ 
    zona: user?.zonaAsignada || '', 
    inicio: '', 
    fin: '' 
  });

  const fechaHoy = new Date().toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Fetch real guards and zones from DB
        const [resGuardias, resZonas] = await Promise.all([
          getGuardias(),
          getZonas()
        ]);

        const guardiasDb = resGuardias.success ? resGuardias.data : [];
        const zonasDb = resZonas.success ? resZonas.data : [];

        // Populate zone filters
        const zonasNombres = zonasDb.map(z => z.nombre);
        setZonasOptions(['Todas', ...zonasNombres]);

        // Cargar rondas guardadas localmente (simulando BD)
        const savedRondas = JSON.parse(localStorage.getItem('rondas_mock_db') || '[]');
        setHistorial(savedRondas.sort((a, b) => a.inicio.localeCompare(b.inicio)));
      } catch (error) {
        console.error("Error cargando datos para actividades", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();

    // Listen to real-time rounds
    const handleNuevaRonda = (data) => {
      console.log('Nueva ronda recibida via WS:', data);
      
      const [hIni] = data.inicio.split(':').map(Number);
      const [hFin] = data.fin.split(':').map(Number);
      let duracion = hFin - hIni;
      if (duracion <= 0) duracion += 24;

      const nuevaRondaObj = {
        id: Date.now() + Math.random(),
        zona: data.zona,
        guardia: data.guardia,
        inicio: data.inicio,
        fin: data.fin,
        duracion: duracion
      };

      setHistorial(prev => {
        const yaExiste = prev.some(
          r => r.zona === nuevaRondaObj.zona &&
               r.guardia === nuevaRondaObj.guardia &&
               r.inicio === nuevaRondaObj.inicio &&
               r.fin === nuevaRondaObj.fin
        );
        if (yaExiste) return prev;

        const next = [...prev, nuevaRondaObj].sort((a, b) => a.inicio.localeCompare(b.inicio));
        localStorage.setItem('rondas_mock_db', JSON.stringify(next));
        return next;
      });
    };

    adminWsService.on('nueva_ronda', handleNuevaRonda);
    const handleNuevaRondaEvent = (e) => handleNuevaRonda(e.detail);
    window.addEventListener('app-nueva-ronda', handleNuevaRondaEvent);

    // Poll REST API as fallback every 10s
    const fetchRondasRest = async () => {
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
                   x.inicio === r.inicio && x.fin === r.fin
            );
            if (!yaExiste) {
              const [hIni] = r.inicio.split(':').map(Number);
              const [hFin] = r.fin.split(':').map(Number);
              let duracion = hFin - hIni;
              if (duracion <= 0) duracion += 24;
              updated.push({
                id: Date.now() + Math.random(),
                zona: r.zona, guardia: r.guardia,
                inicio: r.inicio, fin: r.fin,
                duracion
              });
            }
          }
          updated.sort((a, b) => a.inicio.localeCompare(b.inicio));
          localStorage.setItem('rondas_mock_db', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.warn('[Rondas] Error polling REST:', err);
      }
    };
    const interval = setInterval(fetchRondasRest, 10000);

    return () => {
      adminWsService.on('nueva_ronda', null); // cleanup
      window.removeEventListener('app-nueva-ronda', handleNuevaRondaEvent);
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
