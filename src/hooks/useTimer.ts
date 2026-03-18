import { useState, useRef, useCallback } from 'react';

// Formats a number of seconds into mm:ss string
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  }, [isRunning]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    clearInterval(intervalRef.current!);
    setIsRunning(false);
  }, [isRunning]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current!);
    setIsRunning(false);
    setSeconds(0);
  }, []);

  return {
    time: formatTime(seconds),
    seconds,
    isRunning,
    start,
    pause,
    stop,
  };
}
