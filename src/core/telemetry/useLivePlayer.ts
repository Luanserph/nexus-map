import { useCallback, useEffect, useRef, useState } from 'react';
import type { LivePlayerTelemetry } from '../../types/schema';

export type TelemetryConnectionStatus =
  | 'offline'
  | 'connecting'
  | 'live'
  | 'simulated';

export interface UseLivePlayerOptions {
  gameSlug: string;
  mapId: string;
  bounds?: [number, number, number, number];
  defaultUrl?: string;
}

export interface UseLivePlayerResult {
  status: TelemetryConnectionStatus;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  player: LivePlayerTelemetry | null;
  followCamera: boolean;
  setFollowCamera: (follow: boolean) => void;
  connect: () => void;
  disconnect: () => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  lastError: string | null;
}

const DEFAULT_WS_URL = 'ws://localhost:7777';
const STORAGE_KEY_WS_URL = 'nexus-maps:telemetry-ws-url';

function buildSimulationWaypoints(
  bounds: [number, number, number, number]
): [number, number][] {
  const [minX, minY, maxX, maxY] = bounds;
  const w = maxX - minX;
  const h = maxY - minY;

  return [
    [minX + w * 0.42, minY + h * 0.25],
    [minX + w * 0.32, minY + h * 0.42],
    [minX + w * 0.46, minY + h * 0.56],
    [minX + w * 0.64, minY + h * 0.52],
    [minX + w * 0.55, minY + h * 0.72],
    [minX + w * 0.40, minY + h * 0.74],
    [minX + w * 0.42, minY + h * 0.25],
  ];
}

function computeHeadingDegrees(dx: number, dy: number): number {
  // 0 deg = North (+Y), 90 deg = East (+X), 180 deg = South (-Y), 270 deg = West (-X)
  const rad = Math.atan2(dx, dy);
  const deg = (rad * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function useLivePlayer({
  gameSlug,
  mapId,
  bounds = [0, -144, 128, 0],
  defaultUrl = DEFAULT_WS_URL,
}: UseLivePlayerOptions): UseLivePlayerResult {
  const [wsUrl, setWsUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_WS_URL) || defaultUrl;
    } catch {
      return defaultUrl;
    }
  });
  const [status, setStatus] = useState<TelemetryConnectionStatus>('offline');
  const [player, setPlayer] = useState<LivePlayerTelemetry | null>(null);
  const [followCamera, setFollowCamera] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const rafRef = useRef<number | null>(null);

  const setWsUrl = useCallback((nextUrl: string) => {
    setWsUrlState(nextUrl);
    try {
      localStorage.setItem(STORAGE_KEY_WS_URL, nextUrl);
    } catch {
      // Ignore storage quota/privacy errors
    }
  }, []);

  const stopSimulation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  const disconnect = useCallback(() => {
    stopSimulation();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('offline');
    setPlayer(null);
    setLastError(null);
  }, [stopSimulation]);

  const connect = useCallback(() => {
    stopSimulation();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setLastError(null);
    setStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('live');
        setLastError(null);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as Partial<LivePlayerTelemetry>;
          if (
            typeof parsed.x !== 'number' ||
            typeof parsed.y !== 'number' ||
            !Number.isFinite(parsed.x) ||
            !Number.isFinite(parsed.y)
          ) {
            return;
          }

          if (parsed.game && parsed.game !== gameSlug) return;
          if (parsed.mapId && parsed.mapId !== mapId) return;

          setPlayer({
            game: parsed.game ?? gameSlug,
            mapId: parsed.mapId ?? mapId,
            x: parsed.x,
            y: parsed.y,
            heading:
              typeof parsed.heading === 'number' && Number.isFinite(parsed.heading)
                ? parsed.heading
                : 0,
          });
        } catch {
          // Ignore malformed telemetry frames
        }
      };

      ws.onerror = () => {
        setLastError(`Não foi possível conectar a ${wsUrl}`);
      };

      ws.onclose = () => {
        if (socketRef.current === ws) {
          socketRef.current = null;
          setStatus('offline');
        }
      };
    } catch (error) {
      setStatus('offline');
      setLastError(
        error instanceof Error ? error.message : 'URL WebSocket inválida.'
      );
    }
  }, [wsUrl, gameSlug, mapId, stopSimulation]);

  const toggleSimulation = useCallback(() => {
    if (isSimulating) {
      stopSimulation();
      setStatus('offline');
      setPlayer(null);
      return;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setLastError(null);
    setIsSimulating(true);
    setStatus('simulated');

    const waypoints = buildSimulationWaypoints(bounds);
    const segmentDurationMs = 3800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const totalSegments = waypoints.length - 1;
      const elapsed = now - startTime;
      const rawProgress = (elapsed / segmentDurationMs) % totalSegments;
      const segIdx = Math.floor(rawProgress);
      const t = rawProgress - segIdx;

      const [x1, y1] = waypoints[segIdx];
      const [x2, y2] = waypoints[segIdx + 1];

      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const heading = computeHeadingDegrees(x2 - x1, y2 - y1);

      setPlayer({
        game: gameSlug,
        mapId,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        heading: Math.round(heading),
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [isSimulating, stopSimulation, bounds, gameSlug, mapId]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [gameSlug, mapId]);

  return {
    status,
    wsUrl,
    setWsUrl,
    player,
    followCamera,
    setFollowCamera,
    connect,
    disconnect,
    isSimulating,
    toggleSimulation,
    lastError,
  };
}
