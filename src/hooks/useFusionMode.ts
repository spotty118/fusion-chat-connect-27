import { useState, useEffect } from 'react';

export const useFusionMode = () => {
  const [isFusionMode, setIsFusionMode] = useState(() => {
    return localStorage.getItem('fusionMode') === 'true';
  });

  const toggleFusionMode = () => {
    const newValue = !isFusionMode;
    localStorage.setItem('fusionMode', String(newValue));
    setIsFusionMode(newValue);
  };

  useEffect(() => {
    const updateFusionMode = (e: StorageEvent) => {
      if (e.key === 'fusionMode') {
        setIsFusionMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', updateFusionMode);
    return () => window.removeEventListener('storage', updateFusionMode);
  }, []);

  return { isFusionMode, toggleFusionMode };
};