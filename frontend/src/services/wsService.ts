const WS_BASE = import.meta.env.VITE_WS_URL;
 
type WsEvent = "nueva_alerta" | "alerta_asumida" | "alerta_cerrada";
type Handler = (data: any) => void;
 
class WsService {
  private socket: WebSocket | null = null;
  private handlers: Partial<Record<WsEvent, Handler>> = {};
  private connecting = false;
 
  async connect() {
    if (!WS_BASE) {
      console.error("WS: VITE_WS_URL no está definida en .env");
      return;
    }
 
    if (this.connecting || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }
 
    const token = localStorage.getItem("token") || "";
 
    if (!token) {
      console.error("WS: no hay token disponible");
      return;
    }
 
    this.connecting = true;
    const url = `${WS_BASE}/ws?token=${token}`;
    console.log("WS conectando a:", url);
    this.socket = new WebSocket(url);
 
    this.socket.onopen = () => {
      this.connecting = false;
      console.log("WS conectado ✅");
    };
 
    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("WS mensaje recibido:", data);
        
        if (data.tipo === 'nueva_alerta') {
          window.dispatchEvent(new CustomEvent('app-nueva-alerta', { detail: data }));
        } else if (data.tipo === 'alerta_asumida') {
          window.dispatchEvent(new CustomEvent('app-alerta-asumida', { detail: data }));
        }
 
        const handler = this.handlers[data.tipo as WsEvent];
        if (handler) handler(data);
      } catch (err) {
        console.error("WS parse error", err);
      }
    };
 
    this.socket.onerror = (e) => {
      this.connecting = false;
      console.error("WS error", e);
    };
 
    this.socket.onclose = () => {
      this.connecting = false;
      console.log("WS cerrado");
    };
  }
 
  on(event: WsEvent, handler: Handler) {
    this.handlers[event] = handler;
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
 
export const wsService = new WsService();
