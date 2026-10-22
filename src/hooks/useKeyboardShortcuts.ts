import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onKnown?: () => void;
  onUnderstand?: () => void;
  onNew?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTogglePlay?: () => void;
  onSpeak?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onKnown,
  onUnderstand,
  onNew,
  onNext,
  onPrevious,
  onTogglePlay,
  onSpeak,
  enabled = true
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case '1':
          e.preventDefault();
          onKnown?.();
          break;
        case '2':
          e.preventDefault();
          onUnderstand?.();
          break;
        case '3':
          e.preventDefault();
          onNew?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious?.();
          break;
        case ' ':
          e.preventDefault();
          onTogglePlay?.();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          onSpeak?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onKnown, onUnderstand, onNew, onNext, onPrevious, onTogglePlay, onSpeak]);
}
