import React, { useState, useEffect } from 'react';
import './Actividades.css';
import { getGuardias } from '../services/usuariosService';
import { getZonas } from '../services/zonasService';

const Actividades = () => {
  const [historial, setHistorial] = useState([]);
  const [filtroZona, setFiltroZona] = useState('Todas');
  const [busquedaGuardia, setBusquedaGuardia] = useState('');
  const [zonasOptions, setZonasOptions] = useState(['Todas']);
  const [loading, setLoading] = useState(true);

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

        // Generate mock history using real guards and zones from the DB
        if (guardiasDb.length > 0 && zonasDb.length > 0) {
          const mockHistorial = [];
          
          // Generar entre 3 y 8 registros aleatorios
          const numRegistros = Math.floor(Math.random() * 6) + 3;
          
          for (let i = 0; i < numRegistros; i++) {
            const guardiaRandom = guardiasDb[Math.floor(Math.random() * guardiasDb.length)];
            const zonaRandom = zonasDb[Math.floor(Math.random() * zonasDb.length)];
            
            // Tiempos aleatorios
            const horaIni = 7 + Math.floor(Math.random() * 10);
            const duracion = Math.floor(Math.random() * 2) + 1; // 1 o 2 horas
            const horaFin = horaIni + duracion;

            const formatHora = (h) => `${h.toString().padStart(2, '0')}:00`;

            mockHistorial.push({
              id: i + 1,
              zona: zonaRandom.nombre,
              guardia: guardiaRandom.nombre || 'Guardia Desconocido',
              inicio: formatHora(horaIni),
              fin: formatHora(horaFin),
              duracion: duracion
            });
          }
          
          setHistorial(mockHistorial.sort((a, b) => a.inicio.localeCompare(b.inicio)));
        } else {
          // Fallback if no data
          setHistorial([]);
        }
      } catch (error) {
        console.error("Error cargando datos para actividades", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

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
        <div>
          <h1 className="act-title">Registro de Actividades</h1>
          <p className="act-subtitle">Historial y control de coberturas de rondas por guardia y zona</p>
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
            <span>Rondas Ejecutadas (Simuladas con BD Real)</span>
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
    </div>
  );
};

export default Actividades;
