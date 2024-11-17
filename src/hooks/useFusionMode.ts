import { useState, useEffect } from 'react';

export const useFusionMode = () => {
  const [isFusionMode, setIsFusionMode] = useState(() => {
    // Explicitly check for 'true' string, default to false if not set
    const storedValue = localStorage.getItem('fusionMode');
    return storedValue === 'true';
  });

  const toggleFusionMode = () => {
    const newValue = !isFusionMode;
    localStorage.setItem('fusionMode', String(newValue));
    setIsFusionMode(newValue);
    console.log('Fusion mode toggled:', newValue);
  };

  useEffect(() => {
    const updateFusionMode = (e: StorageEvent) => {
      if (e.key === 'fusionMode') {
        setIsFusionMode(e.newValue === 'true');
        console.log('Fusion mode updated from storage:', e.newValue === 'true');
      }
    };

    window.addEventListener('storage', updateFusionMode);
    return () => window.removeEventListener('storage', updateFusionMode);
  }, []);

  return { isFusionMode, toggleFusionMode };
};