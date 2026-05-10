import './DashboardCounters.css';

const DashboardCounters = ({ data = {} }) => {
  const {
    usuarios = { total: 0, activos: 0, inactivos: 0, nuevosMes: 0, crecimiento: 0 },
    alertas = { total: 0, activas: 0, asignadas: 0, cerradas: 0, criticas: 0, nuevasHoy: 0, resueltasHoy: 0 },
    zonas = { total: 0, activas: 0, inactivas: 0, nuevasMes: 0, cobertura: 0 }
  } = data;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-EC').format(num);
  };

  const formatPercentage = (num) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  return (
    <div className="counters-container">
      <div className="counters-grid">
        {/* Usuarios */}
        <div className="counter-card">
          <div className="counter-icon usuarios-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0v4a4 4 0 018 0M12 14a4 4 0 01-4 4m4-4a4 4 0 018 0M12 14v4m-6-4h6M6 4h6" />
            </svg>
          </div>
          <div className="counter-content">
            <h3>Usuarios</h3>
            <div className="counter-number">{formatNumber(usuarios.total)}</div>
            <div className="counter-details">
              <div className="detail-item">
                <span className="detail-label">Activos:</span>
                <span className="detail-value">{formatNumber(usuarios.activos)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Inactivos:</span>
                <span className="detail-value">{formatNumber(usuarios.inactivos)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nuevos este mes:</span>
                <span className="detail-value positive">+{formatNumber(usuarios.nuevosMes)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Crecimiento:</span>
                <span className={`detail-value ${usuarios.crecimiento > 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(usuarios.crecimiento)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="counter-card">
          <div className="counter-icon alertas-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 10.114V11m-6 0V6a3 3 0 116 0v5m-6 0h6" />
            </svg>
          </div>
          <div className="counter-content">
            <h3>Alertas</h3>
            <div className="counter-number">{formatNumber(alertas.total)}</div>
            <div className="counter-details">
              <div className="detail-item">
                <span className="detail-label">Activas:</span>
                <span className="detail-value alert-active">{formatNumber(alertas.activas)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Asignadas:</span>
                <span className="detail-value alert-assigned">{formatNumber(alertas.asignadas)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cerradas:</span>
                <span className="detail-value alert-closed">{formatNumber(alertas.cerradas)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Críticas:</span>
                <span className="detail-value alert-critical">{formatNumber(alertas.criticas)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nuevas hoy:</span>
                <span className="detail-value positive">+{formatNumber(alertas.nuevasHoy)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Resueltas hoy:</span>
                <span className="detail-value positive">+{formatNumber(alertas.resueltasHoy)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zonas */}
        <div className="counter-card">
          <div className="counter-icon zonas-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-1.414.586l-4.243-4.242a1.999 1.999 0 01-.586 1.414l4.242-4.243a1.999 1.999 0 011.414-.586l4.243-4.242a1.999 1.999 0 01.586-1.414l-4.243 4.242a1.999 1.999 0 01-1.414.586l4.242-4.243a1.999 1.999 0 01-.586-1.414l-4.242 4.243a1.999 1.999 0 011.414-.586l4.242-4.242A1.999 1.999 0 0118.657 16.657zM12 14a2 2 0 100-4 2 2 2 0 1004 2z" />
            </svg>
          </div>
          <div className="counter-content">
            <h3>Zonas</h3>
            <div className="counter-number">{formatNumber(zonas.total)}</div>
            <div className="counter-details">
              <div className="detail-item">
                <span className="detail-label">Activas:</span>
                <span className="detail-value">{formatNumber(zonas.activas)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Inactivas:</span>
                <span className="detail-value">{formatNumber(zonas.inactivas)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nuevas este mes:</span>
                <span className="detail-value positive">+{formatNumber(zonas.nuevasMes)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cobertura:</span>
                <span className={`detail-value ${zonas.cobertura > 80 ? 'positive' : 'negative'}`}>
                  {formatPercentage(zonas.cobertura)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCounters;
