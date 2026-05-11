import './DashboardCharts.css';

const DashboardCharts = ({ data = {} }) => {
const estadisticas = data || {};

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-EC').format(num);
  };

  return (
    <div className="charts-container">
      <div className="charts-grid">
        {/* Gráfico de Alertas por Día */}
        <div className="chart-card">
          <h3>Alertas por Día</h3>
          <div className="chart-content">
            <div className="bar-chart">
              {estadisticas.alertasPorDia?.map((dia, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-label">{dia.dia}</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        height: `${Math.min((dia.count / Math.max(...(estadisticas.alertasPorDia?.map(d => d.count) || [1]))) * 100, 100)}%`,
                        backgroundColor: '#3b82f6'
                      }}
                    />
                  </div>
                  <div className="bar-value">{dia.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico de Alertas por Tipo */}
        <div className="chart-card">
          <h3>Alertas por Tipo</h3>
          <div className="chart-content">
            <div className="pie-chart">
              {estadisticas.alertasPorTipo?.map((tipo, index) => {
                const total = estadisticas.alertasPorTipo.reduce((sum, t) => sum + t.cantidad, 0);
                const percentage = (tipo.cantidad / total) * 100;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                
                return (
                  <div key={index} className="pie-segment">
                    <div 
                      className="segment-fill"
                      style={{ 
                        backgroundColor: colors[index % colors.length],
                        transform: `rotate(${index * 72}deg)`,
                        transformOrigin: 'center'
                      }}
                    />
                    <div className="segment-label">
                      <span className="label-text">{tipo.tipo}</span>
                      <span className="label-value">{tipo.cantidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfico de Usuarios por Rol */}
        <div className="chart-card">
          <h3>Usuarios por Rol</h3>
          <div className="chart-content">
            <div className="horizontal-bar-chart">
              {estadisticas.usuariosPorRol?.map((rol, index) => {
                const total = estadisticas.usuariosPorRol.reduce((sum, r) => sum + r.cantidad, 0);
                const percentage = (rol.cantidad / total) * 100;
                const colors = ['#3b82f6', '#10b981', '#f59e0b'];
                
                return (
                  <div key={index} className="horizontal-bar-item">
                    <div className="horizontal-bar-label">{rol.rol}</div>
                    <div className="horizontal-bar-container">
                      <div 
                        className="horizontal-bar-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colors[index % colors.length]
                        }}
                      />
                      <span className="horizontal-bar-value">{formatNumber(rol.cantidad)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
