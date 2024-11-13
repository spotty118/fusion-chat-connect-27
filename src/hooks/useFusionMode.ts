import { useState, useEffect } from 'react';

export const useFusionMode = () => {
  const [isFusionMode, setIsFusionMode] = useState(() => {
    return localStorage.getItem('fusionMode') === 'true';
  });

  useEffect(() => {
    const updateFusionMode = (e: StorageEvent) => {
      if (e.key === 'fusionMode') {
        setIsFusionMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', updateFusionMode);
    return () => window.removeEventListener('storage', updateFusionMode);
  }, []);

  return isFusionMode;
};