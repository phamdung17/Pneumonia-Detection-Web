import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { POLLING_INTERVAL, WS_MAX_RETRIES } from "../utils/constants";

interface WebSocketOptions {
  onProgress?: (stage: string, status: string, data?: any) => void;
  onComplete?: (predictionId: string) => void;
  onError?: (message: string) => void;
}

type PollEnvelope = {
  stage: string;
  status: string;
  data: any;
  predictionId: string | null;
};

const getWebSocketBaseUrl = () => {
  const configured = import.meta.env.VITE_WS_URL;
  if (configured) return configured;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  if (apiUrl.startsWith("https://")) return apiUrl.replace("https://", "wss://");
  if (apiUrl.startsWith("http://")) return apiUrl.replace("http://", "ws://");
  return apiUrl;
};

const normalizePollingResult = (result: any): PollEnvelope => {
  if (result && typeof result.stage === "string" && typeof result.status === "string") {
    return {
      stage: result.stage,
      status: result.status,
      data: result.data,
      predictionId: result.predictionId || result.prediction_id || null,
    };
  }

  const rawStatus = String(result?.status || "").toLowerCase();
  if (rawStatus === "done") {
    return {
      stage: "final",
      status: "done",
      data: result,
      predictionId: result?.id != null ? String(result.id) : null,
    };
  }

  if (rawStatus === "failed") {
    return {
      stage: "error",
      status: "failed",
      data: { message: result?.error_message || "Prediction failed" },
      predictionId: null,
    };
  }

  if (rawStatus === "processing") {
    return {
      stage: "T1",
      status: "running",
      data: { message: "DenseNet-121 analyzing image...", progress: 45 },
      predictionId: null,
    };
  }

  return {
    stage: "queued",
    status: "queued",
    data: { message: "Task queued", progress: 0 },
    predictionId: null,
  };
};

export const useWebSocket = (taskId: string | null, options: WebSocketOptions = {}) => {
  const [isPolling, setIsPolling] = useState(false);
  const retryCount = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldReconnectRef = useRef(true);

  const stopPolling = () => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const startPolling = () => {
    if (!taskId || pollingIntervalRef.current) return;

    setIsPolling(true);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/api/predict/${taskId}`);
        const result = normalizePollingResult(response.data);

        options.onProgress?.(result.stage, result.status, result.data);

        if (result.status === "done" || result.status === "failed") {
          if (result.status === "done" && result.predictionId) {
            options.onComplete?.(result.predictionId);
          }
          shouldReconnectRef.current = false;
          stopPolling();
        }
      } catch (error) {
        console.error("Polling error:", error);
        options.onError?.("Không thể lấy tiến trình chẩn đoán");
      }
    }, POLLING_INTERVAL);
  };

  const connect = () => {
    if (!taskId) return;

    const socket = new WebSocket(`${getWebSocketBaseUrl()}/ws/${taskId}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const predictionId = payload.predictionId || payload.prediction_id || null;

      options.onProgress?.(payload.stage, payload.status, payload.data);

      if (payload.stage === "final" && payload.status === "done") {
        shouldReconnectRef.current = false;
        if (predictionId) {
          options.onComplete?.(predictionId);
        }
        socket.close();
      }

      if (payload.stage === "error" || payload.status === "failed") {
        shouldReconnectRef.current = false;
        options.onError?.(payload.data?.message || "Prediction failed");
        socket.close();
      }
    };

    socket.onerror = () => {
      shouldReconnectRef.current = false;
      startPolling();
      socket.close();
    };

    socket.onclose = () => {
      if (!shouldReconnectRef.current) return;

      if (retryCount.current < WS_MAX_RETRIES) {
        const delay = Math.pow(2, retryCount.current) * 1000;
        setTimeout(() => {
          retryCount.current += 1;
          connect();
        }, delay);
      } else {
        startPolling();
      }
    };
  };

  useEffect(() => {
    retryCount.current = 0;
    shouldReconnectRef.current = true;

    if (taskId) {
      connect();
    }

    return () => {
      shouldReconnectRef.current = false;
      if (socketRef.current) socketRef.current.close();
      stopPolling();
    };
  }, [taskId]);

  return { isPolling };
};
