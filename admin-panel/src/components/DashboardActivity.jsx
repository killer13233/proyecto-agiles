import './DashboardActivity.css';

const DashboardActivity = ({ actividades = [] }) => {
  const getTipoIcon = (tipo) => {
    const iconos = {
      alerta_asignada: '👤',
      zona_creada: '🗺️',
      alerta_cerrada: '✅',
      usuario_creado: '👥',
      alerta_critica: '🚨'
    };

    return iconos[tipo] || '📢';
  };

  const getTipoColor = (tipo) => {
    const colores = {
      alerta_asignada: '#2563eb',
      zona_creada: '#10b981',
      alerta_cerrada: '#6b7280',
      usuario_creado: '#8b5cf6',
      alerta_critica: '#dc2626'
    };

    return colores[tipo] || '#6b7280';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="activity-container">
      <h3>Actividad Reciente</h3>

      <div className="activity-list">
        {actividades.map((actividad) => (
          <div key={actividad.id} className="activity-item">
            <div
              className="activity-indicator"
              style={{
                backgroundColor: getTipoColor(actividad.tipo)
              }}
            >
              {getTipoIcon(actividad.tipo)}
            </div>

            <div className="activity-content">
              <div className="activity-header">
                <span className="activity-description">
                  {actividad.descripcion}
                </span>

                <span className="activity-time">
                  {formatTime(actividad.timestamp)}
                </span>
              </div>

              <div className="activity-details">
                <span className="activity-user">
                  por {actividad.usuario}
                </span>

                <span className="activity-info">
                  {actividad.detalles}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardActivity;