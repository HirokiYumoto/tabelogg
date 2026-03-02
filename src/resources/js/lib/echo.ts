import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import apiClient from '@/api/client';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

let echo: Echo | null = null;

// --- Reconnection detection ---
type ReconnectCallback = () => void;
const reconnectCallbacks = new Set<ReconnectCallback>();
let reconnectionSetup = false;

export function onReconnect(cb: ReconnectCallback): () => void {
  reconnectCallbacks.add(cb);
  return () => { reconnectCallbacks.delete(cb); };
}

export function setupReconnectionDetection(): void {
  if (reconnectionSetup) return;
  reconnectionSetup = true;

  const echoInstance = getEcho();
  const pusher = (echoInstance as any).connector?.pusher as Pusher | undefined;
  if (!pusher) return;

  let wasConnected = false;

  pusher.connection.bind('connected', () => {
    if (wasConnected) {
      // This is a RE-connection (not the initial connect)
      reconnectCallbacks.forEach((cb) => cb());
    }
    wasConnected = true;
  });

  pusher.connection.bind('disconnected', () => {
    // Keep wasConnected = true so next 'connected' triggers callbacks
  });
}

export function getEcho(): Echo {
  if (!echo) {
    window.Pusher = Pusher;
    echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
      wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
      enabledTransports: ['ws', 'wss'],
      // apiClient を使って Cookie/CSRF 付きで認証する
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: any, data: any) => void) => {
          apiClient
            .post('/broadcasting/auth', {
              socket_id: socketId,
              channel_name: channel.name,
            })
            .then((response) => callback(null, response.data))
            .catch((error) => callback(error, null));
        },
      }),
    });

    // broadcast()->toOthers() が送信者を除外できるよう、
    // API リクエストに X-Socket-ID ヘッダーを付与する
    const echoRef = echo;
    apiClient.interceptors.request.use((config) => {
      const socketId = echoRef.socketId();
      if (socketId) {
        config.headers['X-Socket-ID'] = socketId;
      }
      return config;
    });
  }
  return echo;
}

export default getEcho;
