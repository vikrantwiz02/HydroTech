import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  url: string;
  userId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onPredictionUpdate?: (data: any) => void;
  onWeatherUpdate?: (data: any) => void;
  onForecastUpdate?: (data: any) => void;
  onSystemNotification?: (message: string, level: string) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    url,
    userId,
    onMessage,
    onPredictionUpdate,
    onWeatherUpdate,
    onForecastUpdate,
    onSystemNotification,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);
  const reconnectAttempts = useRef(0);
  const messageQueue = useRef<any[]>([]);
  const maxReconnectAttempts = useRef<number>(10);

  const connect = useCallback(() => {
    try {
      // Avoid creating a new connection if one already exists
      if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
        return;
      }

      const wsUrl = userId ? `${url}?user_id=${userId}` : url;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        reconnectAttempts.current = 0;
        setIsConnected(true);
        setConnectionError(null);
        // flush queued messages
        while (messageQueue.current.length > 0 && ws.current && ws.current.readyState === WebSocket.OPEN) {
          const msg = messageQueue.current.shift();
          try { ws.current.send(JSON.stringify(msg)); } catch { /* ignore */ }
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (onMessage) onMessage(message);

          switch (message.type) {
            case 'prediction_update':
              if (onPredictionUpdate && message.data) onPredictionUpdate(message.data);
              break;
            case 'weather_update':
              if (onWeatherUpdate && message.data) onWeatherUpdate(message.data);
              break;
            case 'forecast_update':
              if (onForecastUpdate && message.data) onForecastUpdate(message.data);
              break;
            case 'system_notification':
              if (onSystemNotification) {
                const level = (message as any).level || 'info';
                onSystemNotification(message.message || '', level);
              }
              break;
            case 'connection_success':
              // no-op
              break;
            case 'pong':
              // heartbeat
              break;
            default:
              // ignore unknown message types to avoid console spam
              break;
          }
        } catch (error) {
          // ignore parse errors to avoid console spam
        }
      };

      ws.current.onerror = () => {
        // Only record a user-facing connection error once per reconnect attempt
        if (!connectionError) setConnectionError('WebSocket connection error');
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        // exponential backoff with jitter
        if (autoReconnect && shouldReconnect.current) {
          reconnectAttempts.current += 1;
          if (reconnectAttempts.current <= maxReconnectAttempts.current) {
            const base = reconnectInterval;
            const backoff = Math.min(60000, base * Math.pow(2, Math.max(0, reconnectAttempts.current - 1)));
            const jitter = Math.floor(Math.random() * 1000);
            const delay = backoff + jitter;
            reconnectTimeout.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            // stop trying after max attempts
            shouldReconnect.current = false;
            setConnectionError('Unable to connect to WebSocket (max attempts reached)');
          }
        }
      };
    } catch (error) {
      // avoid console spam
      setConnectionError('Failed to initialize WebSocket connection');
    }
  }, [url, userId, onMessage, onPredictionUpdate, onWeatherUpdate, onForecastUpdate, onSystemNotification, autoReconnect, reconnectInterval]);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Send message to server
  const sendMessage = useCallback((message: any) => {
    try {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(message));
        return true;
      }
      // queue the message to send once connection is established
      messageQueue.current.push(message);
      return false;
    } catch (e) {
      return false;
    }
  }, []);

  // Request weather update
  const requestWeather = useCallback((lat: number, lon: number) => {
    return sendMessage({
      type: 'request_weather',
      lat,
      lon,
    });
  }, [sendMessage]);

  // Subscribe to zone updates
  const subscribeToZone = useCallback((zone: string) => {
    return sendMessage({
      type: 'subscribe_zone',
      zone,
    });
  }, [sendMessage]);

  // Send heartbeat ping
  const ping = useCallback(() => {
    return sendMessage({ type: 'ping' });
  }, [sendMessage]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    connect();
  }, [connect]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    requestWeather,
    subscribeToZone,
    ping,
    reconnect,
  };
};
