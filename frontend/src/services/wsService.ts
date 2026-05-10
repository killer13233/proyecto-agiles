import { Preferences } from "@capacitor/preferences";

const WS_BASE = import.meta.env.VITE_WS_URL;

type WsEvent = "nueva_alerta" | "alerta_asumida" | "alerta_cerrada";
type Handler = (data: any) => void;

class WsService {
  private socket: WebSocket | null = null;
  private handlers: Partial<Record<WsEvent, Handler>> = {};

  async connect() {
    const { value: token } = await Preferences.get({ key: "token" });
    const url = `${WS_BASE}/ws?token=${token}`;
    this.socket = new WebSocket(url);

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const handler = this.handlers[data.tipo as WsEvent];
        if (handler) handler(data);
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    this.socket.onerror = (e) => console.error("WS error", e);
    this.socket.onclose = () => console.log("WS cerrado");
  }

  on(event: WsEvent, handler: Handler) {
    this.handlers[event] = handler;
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}

export const wsService = new WsService();