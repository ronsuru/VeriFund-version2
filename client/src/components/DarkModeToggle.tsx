import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { applyMode, getStoredTheme, getSystemPrefersDark, setMode as setThemeMode, ThemeMode } from '@/lib/theme';

export function DarkModeToggle() {
  const [mode, setLocalMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const stored = getStoredTheme();
    const initial: ThemeMode = stored ?? (getSystemPrefersDark() ? 'dark' : 'light');
    setLocalMode(initial);
    applyMode(initial);
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setLocalMode(next);
    setThemeMode(next); // persist + apply to document
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} aria-label="Toggle theme">
      {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}


