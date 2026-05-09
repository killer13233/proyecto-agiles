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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.627 5.037c1.498 0 2.858.539 3.611 1.607a2.032 2.032 0 012.864 2.051 1.872A2.032 2.032 0 0115.087 19.528c1.498 0 2.906-.42 3.983-1.17.074-.074.14-.16.277-.292.16-.183.348-.351.558-.592.742-.876.985-.17-.31-.375-.664-.654-1.207-1.024-.267-.204-.572-.378-.934-.626-.41-.187-.803-.458-1.184-.77.251.472.598.717.825 1.148.504.412.982.769 1.342.515.462.997.702 1.212.5.196.983.965 1.263.63.205 1.42.422.655.808 1.367 1.253.926 1.689 2.197 2.074.387.527.773.944 1.041.828 1.587 1.664 2.053 1.895.42.412 1.062.707 1.165 1.341.583 1.723.795.242.465.593.771.926 1.171.942.415.497.987.803 1.264 1.424.738.847.997 1.394 1.176 1.937.754 2.324 1.522 3.12 1.244 3.732 2.238.426.891.342 1.02 2.199.363 1.115 2.418.197 1.21 2.632 1.061 2.848 1.18 3.064 1.048 3.28.915 1.316 3.531 1.064 3.787 1.212 4.043 1.36 4.299 1.509 4.564 1.657 4.819 1.805 5.084 1.952 5.349 2.1 5.614 2.247 5.879 2.394 6.144 2.541 6.409 2.688 6.674 2.835 6.939 2.982 7.204 3.129 7.469 3.276 7.734 3.423 7.999 3.57 8.264 3.717 8.529 3.864 8.794 4.011 9.059 4.158 9.324 4.305 9.589 4.452 9.854 4.599 10.119 4.746 10.384 4.893 10.649 5.04 10.914 5.187 11.179 5.334 11.444 5.481 11.709 5.628 11.974 5.775 12.239 5.922 12.504 6.069 12.769 6.216 13.034 6.363 13.299 6.51 13.564 6.657 13.829 6.804 14.094 6.951 14.359 7.098 14.624 7.245 14.889 7.392 15.154 7.539 15.419 7.686 15.684 7.833 15.949 7.98 16.214 8.127 16.479 8.274 16.744 8.421 17.009 8.568 17.274 8.715 17.539 8.862 17.804 9.009 18.069 9.156 18.334 9.303 18.599 9.45 18.864 9.597 19.129 9.744 19.394 9.891 19.659 10.038 19.924 10.185 20.189 10.332 20.454 10.479 20.719 10.626 20.984 10.773 21.049 10.92 21.314 11.067 21.579 11.214 21.844 11.361 22.109 11.508 22.374 11.655 22.639 11.802 22.904 11.949 23.214 12.096 23.379 12.243 23.544 12.39 23.809 12.537 24.074 12.684 24.339 12.831 24.604 12.978 24.869 13.125 25.134 13.272 25.399 13.419 25.664 13.566 25.929 13.713 26.194 13.86 26.459 14.007 26.604 26.869 14.751 27.134 14.898 27.399 15.045 27.664 15.192 27.929 15.339 28.194 15.486 28.459 15.633 28.724 15.78 28.989 15.927 29.254 16.074 29.519 16.221 29.784 16.368 30.049 16.515 30.314 16.662 30.579 16.809 30.844 16.956 31.109 17.103 31.374 17.25 31.639 17.397 31.904 17.544 32.169 17.691 32.434 17.838 32.699 17.985 32.964 18.132 33.229 18.279 33.494 18.426 33.759 18.573 34.024 18.72 34.289 18.867 34.554 19.014 34.819 19.161 35.084 19.308 35.349 19.455 35.614 19.602 35.879 19.749 36.144 19.896 36.409 20.043 36.674 20.19 36.939 20.337 37.204 20.484 37.469 20.631 37.734 20.778 37.999 20.925 38.264 21.072 38.529 21.219 38.794 21.366 39.059 21.513 39.324 21.66 39.589 21.807 39.854 21.954 40.119 22.101 40.384 22.248 40.649 22.395 40.914 22.542 41.179 22.689 41.444 22.836 41.709 22.983 42.074 23.13 42.339 23.277 42.604 23.424 42.869 23.571 43.134 23.718 43.399 23.845 43.664 23.992 44.029 24.139 44.294 24.286 44.559 24.433 44.824 24.58 45.089 24.727 45.354 24.874 45.619 25.021 45.866 46.131 25.013 46.396 25.16 46.661 25.307 46.926 25.454 47.191 25.601 47.456 25.748 47.721 25.895 47.986 26.042 48.251 26.189 48.516 26.336 48.781 26.483 49.046 26.63 49.311 26.777 49.576 26.924 49.841 27.071 50.106 27.218 50.371 27.365 50.636 27.513 50.801 27.66 51.066 27.813 51.331 27.48 51.596 27.627 51.861 27.774 52.126 27.923 52.391 27.07 52.656 27.217 52.921 27.364 53.186 27.511 53.451 27.658 53.716 27.805 53.971 27.118 54.236 27.265 54.501 27.412 54.766 27.559 55.031 27.706 55.296 27.853 55.561 27" />
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
