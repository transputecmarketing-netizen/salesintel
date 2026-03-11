'use client';

import { useEffect, useCallback, useRef } from 'react';

import { useCommandStore } from '@/stores/command';

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutDefinition {
  key: string;
  meta?: boolean;   // Cmd on Mac, Ctrl on Windows
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  handler: KeyHandler;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardOptions {
  /** Enable the default SalesIntel shortcuts (Cmd+K, etc.) */
  enableDefaults?: boolean;
  /** Additional custom shortcuts */
  shortcuts?: ShortcutDefinition[];
  /** Whether shortcuts are active (e.g., disable when modal is open) */
  enabled?: boolean;
}

interface UseKeyboardReturn {
  registerShortcut: (shortcut: ShortcutDefinition) => void;
  unregisterShortcut: (key: string) => void;
  getRegisteredShortcuts: () => ShortcutDefinition[];
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardReturn {
  const { enableDefaults = true, shortcuts = [], enabled = true } = options;
  const commandStore = useCommandStore();
  const registeredRef = useRef<Map<string, ShortcutDefinition>>(new Map());

  // Build shortcut key for matching
  const getShortcutKey = useCallback((shortcut: ShortcutDefinition): string => {
    const parts: string[] = [];
    if (shortcut.meta) parts.push('meta');
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }, []);

  // Register default shortcuts
  useEffect(() => {
    if (!enableDefaults) return;

    const defaults: ShortcutDefinition[] = [
      {
        key: 'k',
        meta: true,
        handler: () => commandStore.toggle(),
        description: 'Toggle command palette',
        preventDefault: true,
      },
      {
        key: 'Escape',
        handler: () => {
          if (commandStore.isOpen) commandStore.close();
        },
        description: 'Close command palette',
      },
      {
        key: 'ArrowDown',
        handler: () => {
          if (commandStore.isOpen) commandStore.selectNext();
        },
        description: 'Select next command result',
        preventDefault: true,
      },
      {
        key: 'ArrowUp',
        handler: () => {
          if (commandStore.isOpen) commandStore.selectPrevious();
        },
        description: 'Select previous command result',
        preventDefault: true,
      },
      {
        key: 'Enter',
        handler: () => {
          if (commandStore.isOpen) commandStore.executeSelected();
        },
        description: 'Execute selected command',
        preventDefault: true,
      },
      {
        key: '/',
        meta: true,
        handler: () => {
          // Focus global search
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
          searchInput?.focus();
        },
        description: 'Focus search',
        preventDefault: true,
      },
      {
        key: 'n',
        meta: true,
        shift: true,
        handler: () => {
          // Trigger new research
          const event = new CustomEvent('salesintel:new-research');
          window.dispatchEvent(event);
        },
        description: 'New research',
        preventDefault: true,
      },
    ];

    for (const shortcut of defaults) {
      const key = getShortcutKey(shortcut);
      registeredRef.current.set(key, shortcut);
    }
  }, [enableDefaults, commandStore, getShortcutKey]);

  // Register custom shortcuts
  useEffect(() => {
    for (const shortcut of shortcuts) {
      const key = getShortcutKey(shortcut);
      registeredRef.current.set(key, shortcut);
    }

    return () => {
      for (const shortcut of shortcuts) {
        const key = getShortcutKey(shortcut);
        registeredRef.current.delete(key);
      }
    };
  }, [shortcuts, getShortcutKey]);

  // Global keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't capture events in input fields (unless meta/ctrl is pressed)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const hasModifier = event.metaKey || event.ctrlKey;

      if (isInput && !hasModifier && event.key !== 'Escape') return;

      // Build the key combo for this event
      const parts: string[] = [];
      if (event.metaKey || (event.ctrlKey && !isMac())) parts.push('meta');
      if (event.ctrlKey && isMac()) parts.push('ctrl');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');
      parts.push(event.key.toLowerCase());
      const eventKey = parts.join('+');

      const shortcut = registeredRef.current.get(eventKey);
      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  const registerShortcut = useCallback(
    (shortcut: ShortcutDefinition) => {
      const key = getShortcutKey(shortcut);
      registeredRef.current.set(key, shortcut);
    },
    [getShortcutKey]
  );

  const unregisterShortcut = useCallback(
    (key: string) => {
      registeredRef.current.delete(key);
    },
    []
  );

  const getRegisteredShortcuts = useCallback(
    () => Array.from(registeredRef.current.values()),
    []
  );

  return {
    registerShortcut,
    unregisterShortcut,
    getRegisteredShortcuts,
  };
}
