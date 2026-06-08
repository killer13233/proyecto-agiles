const WS_BASE = import.meta.env.VITE_WS_URL;

class AdminWsService {
  constructor() {
    this.socket = null;
    this.handlers = {};
    this.connecting = false;
  }

  connect(token) {
    if (!WS_BASE || !token) return;
    if (this.connecting || this.socket?.readyState === WebSocket.OPEN) return;

    this.connecting = true;
    const url = `${WS_BASE}/ws?token=${token}`;
    console.log('[Admin WS] Conectando a:', url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connecting = false;
      console.log('[Admin WS] Conectado ✅');
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('[Admin WS] Mensaje recibido:', data);

        const handler = this.handlers[data.tipo];
        if (handler) handler(data);

        if (data.tipo === 'ubicacion_usuario') {
          window.dispatchEvent(new CustomEvent('app-ubicacion-usuario', { detail: data }));
        } else if (data.tipo === 'ubicacion_guardia') {
          window.dispatchEvent(new CustomEvent('app-ubicacion-guardia', { detail: data }));
        } else if (data.tipo === 'nueva_ronda') {
          console.log('[Admin WS] Dispatching app-nueva-ronda');
          window.dispatchEvent(new CustomEvent('app-nueva-ronda', { detail: data }));
        }
      } catch (err) {
        console.error('[Admin WS] Error parse:', err);
      }
    };

    this.socket.onerror = (e) => {
      this.connecting = false;
      console.error('[Admin WS] Error:', e);
    };

    this.socket.onclose = () => {
      this.connecting = false;
      console.log('[Admin WS] Cerrado');
    };
  }

  on(evento, handler) {
    if (handler == null) {
      delete this.handlers[evento];
    } else {
      this.handlers[evento] = handler;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connecting = false;
    this.handlers = {};
  }
}

export const adminWsService = new AdminWsService();