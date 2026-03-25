import { useEffect, useRef, useState } from 'react';
import { getPredictResultApi } from '../api/predict';
import { POLLING_INTERVAL, WS_MAX_RETRIES } from '../utils/constants';

export function useWebSocket(taskId, { onProgress, onComplete, onError } = {}) {
  const [isPolling, setIsPolling] = useState(false);
  const retryRef = useRef(0);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!taskId) return undefined;

    let stopped = false;

    const stopPolling = () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };

    const startPolling = () => {
      setIsPolling(true);
      stopPolling();
      pollRef.current = window.setInterval(async () => {
        try {
          const result = await getPredictResultApi(taskId);
          onProgress?.('polling', result.status, result);
          if (result.status === 'done') {
            stopPolling();
            onComplete?.(result.id, result);
          }
          if (result.status === 'failed') {
            stopPolling();
            onError?.('Xu ly that bai');
          }
        } catch (error) {
          onError?.(error?.response?.data?.message ?? 'Khong the cap nhat tien do');
        }
      }, POLLING_INTERVAL);
    };

    const connect = () => {
      const wsBase = import.meta.env.VITE_WS_URL?.replace(/^http/, 'ws');
      wsRef.current = new WebSocket(`${wsBase}/api/predict/ws/${taskId}`);

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        onProgress?.(message.stage, message.status, message);
        if (message.stage === 'final' && message.status === 'done') {
          onComplete?.(message.prediction_id, message);
          wsRef.current?.close();
        }
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };

      wsRef.current.onclose = () => {
        if (stopped) return;
        if (retryRef.current >= WS_MAX_RETRIES) {
          startPolling();
          return;
        }
        const delay = 1000 * 2 ** retryRef.current;
        retryRef.current += 1;
        window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      stopPolling();
      wsRef.current?.close();
    };
  }, [taskId, onComplete, onError, onProgress]);

  return { isPolling };
}
