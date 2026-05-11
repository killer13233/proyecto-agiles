import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const WS_BASE = import.meta.env.VITE_WS_URL;

type WsEvent = "nueva_alerta" | "alerta_asumida" | "alerta_cerrada";
type Handler = (data: any) => void;

class WsService {
  private socket: WebSocket | null = null;
  private handlers: Partial<Record<WsEvent, Handler>> = {};
  private connecting = false; // ✅ flag para evitar doble conexión

  async connect() {
    if (!WS_BASE) {
      console.error("WS: VITE_WS_URL no está definida en .env");
      return;
    }

    // ✅ Si ya hay socket abierto o conectando, no hacer nada
    if (this.connecting) {
      console.warn("WS: conexión en progreso, ignorando...");
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      console.warn("WS: ya conectado, ignorando...");
      return;
    }

    let token = "";
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: "token" });
      token = value || "";
    } else {
      token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        "";
    }

    if (!token) {
      console.error("WS: no hay token disponible");
      return;
    }

    this.connecting = true; // ✅ marcar como conectando
    const url = `${WS_BASE}/ws?token=${token}`;
    console.log("WS conectando a:", url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connecting = false; // ✅ limpiar flag al conectar
      console.log("WS conectado ✅");
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("WS mensaje recibido:", data);
        const handler = this.handlers[data.tipo as WsEvent];
        if (handler) handler(data);
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    this.socket.onerror = (e) => {
      this.connecting = false; // ✅ limpiar flag en error
      console.error("WS error", e);
    };

    this.socket.onclose = () => {
      this.connecting = false; // ✅ limpiar flag al cerrar
      console.log("WS cerrado");
    };
  }

  on(event: WsEvent, handler: Handler) {
    this.handlers[event] = handler;
  }

  disconnect() {
    // ✅ Solo cerrar si está OPEN o CONNECTING
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      this.socket.close();
    }
    this.socket = null;
    this.connecting = false;
    this.handlers = {};
  }
}

export const wsService = new WsService();