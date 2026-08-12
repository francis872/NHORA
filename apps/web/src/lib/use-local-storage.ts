"use client";

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore parse or storage errors.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors.
    }
  }, [hydrated, key, value]);

  const clearValue = () => {
    setValue(defaultValue);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore remove errors.
    }
  };

  return [value, setValue, clearValue] as const;
}
