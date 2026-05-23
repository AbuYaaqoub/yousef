// hotkeys/index.ts
// Handles ALT+C keyboard shortcut

export type HotkeyCallback = () => void;

export function registerHotkeys(onCopy: HotkeyCallback): () => void {
  const handler = (e: KeyboardEvent) => {
    // ALT + C
    if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      e.stopPropagation();
      onCopy();
    }
  };

  document.addEventListener('keydown', handler, true);

  // Return cleanup function
  return () => document.removeEventListener('keydown', handler, true);
}
