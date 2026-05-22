import React, { useEffect } from 'react';
import { IonButton } from '@ionic/react';
import './NotificacionAlerta.css';

interface NotificacionAlertaProps {
  alerta: {
    nombreUsuario: string;
    motivo: string;
    zona: string;
    title?: string;
    body?: string;
    color?: string;
  } | null;
  onClose: () => void;
  onVerDetalles: () => void;
}

const NotificacionAlerta: React.FC<NotificacionAlertaProps> = ({ alerta, onClose, onVerDetalles }) => {
  useEffect(() => {
    if (alerta) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [alerta, onClose]);

  if (!alerta) return null;

  const bodyHtml = alerta.body
    || `<strong>${alerta.nombreUsuario}</strong> solicita ayuda por: <strong>${alerta.motivo}</strong>`;

  return (
    <div className="notificacion-banner">
      <div className="notificacion-content" style={{ borderLeftColor: alerta.color || '#ef4444' }}>
        <div className="notificacion-icon">🚨</div>
        <div className="notificacion-text">
          <p className="notificacion-title" style={{ color: alerta.color || '#ef4444' }}>
            {alerta.title || "¡NUEVA EMERGENCIA!"}
          </p>
          {/* ← dangerouslySetInnerHTML para renderizar el HTML del body */}
          <p
            className="notificacion-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
          {alerta.zona && (
            <p className="notificacion-zona">Ubicación: {alerta.zona}</p>
          )}
        </div>
        <div className="notificacion-actions">
          <IonButton size="small" onClick={onVerDetalles} className="btn-detalles">
            Ver
          </IonButton>
          <IonButton size="small" onClick={onClose} fill="clear" className="btn-cerrar">
            ✕
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default NotificacionAlerta;