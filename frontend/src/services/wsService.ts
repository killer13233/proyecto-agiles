const WS_BASE = import.meta.env.VITE_WS_URL;

type WsEvent = "nueva_alerta" | "alerta_asumida" | "alerta_cerrada" | "guardia_disponibilidad";
type Handler = (data: any) => void;

class WsService {
  private socket: WebSocket | null = null;
  private handlers: Partial<Record<WsEvent, Handler>> = {};
  private connecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private destroyed = false;
  private pendientes: object[] = [];

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.connecting || this.destroyed) return;
    if (!WS_BASE) { console.error("WS: VITE_WS_URL no definida"); return; }
    const token = localStorage.getItem("token") || "";
    if (!token) { console.error("WS: no hay token"); this.scheduleReconnect(); return; }

    this.connecting = true;
    const url = `${WS_BASE}/ws?token=${token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connecting = false;
      this.reconnectDelay = 3000;
      console.log("WS conectado ✅");
      for (const msg of this.pendientes) this.socket!.send(JSON.stringify(msg));
      this.pendientes = [];
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("WS mensaje recibido:", data);
        if (data.tipo === 'nueva_alerta') window.dispatchEvent(new CustomEvent('app-nueva-alerta', { detail: data }));
        else if (data.tipo === 'alerta_asumida') window.dispatchEvent(new CustomEvent('app-alerta-asumida', { detail: data }));
        else if (data.tipo === 'alerta_cerrada') window.dispatchEvent(new CustomEvent('app-alerta-cerrada', { detail: data }));
        const handler = this.handlers[data.tipo as WsEvent];
        if (handler) handler(data);
      } catch (err) { console.error("WS parse error", err); }
    };

    this.socket.onerror = () => { this.connecting = false; };
    this.socket.onclose = (e) => {
      this.connecting = false;
      this.socket = null;
      console.log("WS cerrado (código " + e.code + ")", "reconectando en", this.reconnectDelay, "ms");
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.destroyed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      this.connect();
    }, this.reconnectDelay);
  }

  send(data: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      this.pendientes.push(data);
      if (!this.connecting) this.scheduleReconnect();
    }
  }

  on(event: WsEvent, handler: Handler) { this.handlers[event] = handler; }

  disconnect() {
    this.destroyed = true;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.socket) { this.socket.onclose = null; this.socket.close(); this.socket = null; }
    this.connecting = false;
    this.handlers = {};
    this.pendientes = [];
  }
  reset() {
  this.destroyed = false;
  this.connecting = false;
}
}

export const wsService = new WsService();