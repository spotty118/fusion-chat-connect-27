import { useState, useEffect } from 'react';

export const useFusionMode = () => {
  const [isFusionMode, setIsFusionMode] = useState(false);

  useEffect(() => {
    const updateFusionMode = () => {
      const fusionMode = localStorage.getItem('fusionMode') === 'true';
      setIsFusionMode(fusionMode);
    };

    updateFusionMode();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fusionMode') {
        updateFusionMode();
      }
    });

    return () => {
      window.removeEventListener('storage', updateFusionMode);
    };
  }, []);

  return isFusionMode;
};