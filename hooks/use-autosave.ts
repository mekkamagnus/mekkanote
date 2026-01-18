import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveHookProps<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delay?: number; // Delay in milliseconds (default: 30 seconds)
  onError?: (error: Error) => void;
}

export function useAutoSave<T>({
  value,
  onSave,
  delay = 30000, // 30 seconds
  onError
}: AutoSaveHookProps<T>) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const valueRef = useRef(value);

  // Update the ref when value changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Handle save operation
  const performSave = useCallback(async () => {
    try {
      setStatus('saving');
      setError(null);
      await onSave(valueRef.current);
      setStatus('saved');

      // Reset status after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      if (onError) {
        onError(error);
      }
      setStatus('idle');
    }
  }, [onSave, onError]);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      await performSave();
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, performSave]);

  // Handle blur event (manual save)
  const handleBlur = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    await performSave();
  };

  return {
    status,
    error,
    handleBlur
  };
}