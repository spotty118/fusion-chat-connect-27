import { useEffect } from 'react';

export const useKeyboardShortcuts = (handlers: {
  onSend?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handlers.onSend?.();
            break;
          case 'k':
            e.preventDefault();
            handlers.onSearch?.();
            break;
          case 'e':
            e.preventDefault();
            handlers.onExport?.();
            break;
          case ',':
            e.preventDefault();
            handlers.onSettings?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlers]);
};