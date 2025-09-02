const MODE_KEY = 'verifund-theme';
const THEMES_KEY = 'verifund-themes';
const ACTIVE_THEME_KEY = 'verifund-active-theme';
const STYLE_TAG_ID = 'theme-overrides';

export type ThemeMode = 'light' | 'dark';

export type ThemeTokens = Record<string, string>;

export type ThemeConfig = {
  name: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

export function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return (v === 'dark' || v === 'light') ? v : null;
  } catch {
    return null;
  }
}

export function getSystemPrefersDark(): boolean {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function applyMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function setMode(mode: ThemeMode) {
  try { localStorage.setItem(MODE_KEY, mode); } catch {}
  applyMode(mode);
}

export function initTheme() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const stored = getStoredTheme();
  applyMode(stored ?? 'light'); // Default to light mode
  // Re-apply active theme variables if any
  try {
    const activeName = localStorage.getItem(ACTIVE_THEME_KEY) || 'Default';
    const themes = loadThemes();
    const active = themes.find(t => t.name === activeName) || themes[0];
    if (active) applyThemeVariables(active);
  } catch {}
}

export const editableTokens: string[] = [
  // Core
  'background', 'foreground',
  'card', 'card-foreground',
  'popover', 'popover-foreground',
  'primary', 'primary-foreground',
  'secondary', 'secondary-foreground',
  'accent', 'accent-foreground',
  'muted', 'muted-foreground',
  'destructive', 'destructive-foreground',
  'border', 'input', 'ring',
  // Charts
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  // Sidebar
  'sidebar', 'sidebar-foreground',
  'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground',
  'sidebar-border', 'sidebar-ring',
  // Typography families (text input)
  'font-sans', 'font-serif', 'font-mono',
  // Misc scales (text input)
  'radius'
];

const defaultTheme: ThemeConfig = {
  name: 'Default',
  light: {
    background: '#F5F5F5',
    foreground: '#424242',
    card: '#FFFFFF',
    'card-foreground': '#424242',
    popover: '#FFFFFF',
    'popover-foreground': '#424242',
    primary: '#B9E937',
    'primary-foreground': '#424242',
    secondary: '#00B906',
    'secondary-foreground': '#FFFFFF',
    accent: '#B9E937',
    'accent-foreground': '#424242',
    muted: '#EBEBEB',
    'muted-foreground': '#666666',
    border: '#E0E0E0',
    input: '#FFFFFF',
    ring: '#B9E937',
    'destructive': '#E53935',
    'destructive-foreground': '#FFFFFF',
    'chart-1': '#B9E937',
    'chart-2': '#00B906',
    'chart-3': '#8BC34A',
    'chart-4': '#7CB342',
    'chart-5': '#AED581',
    'sidebar': 'hsl(0 0% 98%)',
    'sidebar-foreground': 'hsl(0 0% 26%)',
    'sidebar-primary': '#B9E937',
    'sidebar-primary-foreground': 'hsl(0 0% 26%)',
    'sidebar-accent': 'hsl(0 0% 94%)',
    'sidebar-accent-foreground': '#B9E937',
    'sidebar-border': 'hsl(0 0% 90%)',
    'sidebar-ring': '#B9E937',
    'font-sans': 'Raleway, sans-serif',
    'font-serif': 'Lato, sans-serif',
    'font-mono': 'Menlo, monospace',
    'radius': '1.3rem'
  },
  dark: {
    background: '#161B16',
    foreground: '#F5F5F5',
    card: '#424242',
    'card-foreground': '#E0E0E0',
    popover: '#424242',
    'popover-foreground': '#F5F5F5',
    primary: '#B9E937',
    'primary-foreground': '#121212',
    secondary: '#00B906',
    'secondary-foreground': '#FFFFFF',
    accent: '#B9E937',
    'accent-foreground': '#121212',
    muted: '#262626',
    'muted-foreground': '#A3A3A3',
    border: '#333333',
    input: '#424242',
    ring: '#B9E937',
    'destructive': '#E53935',
    'destructive-foreground': '#FFFFFF',
    'chart-1': '#B9E937',
    'chart-2': '#00B906',
    'chart-3': '#8BC34A',
    'chart-4': '#7CB342',
    'chart-5': '#AED581',
    'sidebar': '#424242',
    'sidebar-foreground': '#E0E0E0',
    'sidebar-primary': '#B9E937',
    'sidebar-primary-foreground': '#121212',
    'sidebar-accent': '#424242',
    'sidebar-accent-foreground': '#B9E937',
    'sidebar-border': '#2A2A2A',
    'sidebar-ring': '#B9E937',
    'font-sans': 'Raleway, sans-serif',
    'font-serif': 'Lato, sans-serif',
    'font-mono': 'Menlo, monospace',
    'radius': '1.3rem'
  }
};

const brandTheme: ThemeConfig = {
  name: 'Brand',
  light: { ...defaultTheme.light },
  dark: { ...defaultTheme.dark }
};

export function loadThemes(): ThemeConfig[] {
  try {
    const raw = localStorage.getItem(THEMES_KEY);
    if (!raw) return [defaultTheme, brandTheme];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [defaultTheme, brandTheme];
    return parsed;
  } catch {
    return [defaultTheme, brandTheme];
  }
}

export function saveThemes(themes: ThemeConfig[]) {
  try { localStorage.setItem(THEMES_KEY, JSON.stringify(themes)); } catch {}
}

export function getActiveThemeName(): string {
  try { return localStorage.getItem(ACTIVE_THEME_KEY) || 'Default'; } catch { return 'Default'; }
}

export function setActiveThemeName(name: string) {
  try { localStorage.setItem(ACTIVE_THEME_KEY, name); } catch {}
}

function ensureStyleTag(): HTMLStyleElement {
  if (typeof document === 'undefined') {
    // No-op on server
    // @ts-expect-error - returning undefined in SSR context, caller must guard
    return undefined;
  }
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  return tag;
}

export function generateCss(theme: ThemeConfig): string {
  const toVars = (tokens: ThemeTokens) => editableTokens
    .map(k => tokens[k] ? `  --${k}: ${tokens[k]};` : '')
    .join('\n');
  return `:root {\n${toVars(theme.light)}\n}\n.dark {\n${toVars(theme.dark)}\n}`;
}

export function applyThemeVariables(theme: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const css = generateCss(theme);
  const tag = ensureStyleTag();
  if (!tag) return;
  tag.textContent = css;
}

export function upsertTheme(theme: ThemeConfig) {
  const themes = loadThemes();
  const idx = themes.findIndex(t => t.name === theme.name);
  if (idx >= 0) themes[idx] = theme; else themes.push(theme);
  saveThemes(themes);
  if (getActiveThemeName() === theme.name) applyThemeVariables(theme);
}

export function createNewTheme(name: string, base?: string): ThemeConfig {
  const themes = loadThemes();
  const baseTheme = themes.find(t => t.name === (base || getActiveThemeName())) || defaultTheme;
  const copy: ThemeConfig = {
    name,
    light: { ...baseTheme.light },
    dark: { ...baseTheme.dark }
  };
  themes.push(copy);
  saveThemes(themes);
  return copy;
}

export function renameTheme(oldName: string, newName: string) {
  const themes = loadThemes();
  const t = themes.find(x => x.name === oldName);
  if (!t) return;
  t.name = newName;
  saveThemes(themes);
  if (getActiveThemeName() === oldName) setActiveThemeName(newName);
}

export function deleteTheme(name: string) {
  const themes = loadThemes().filter(t => t.name !== name);
  saveThemes(themes);
  if (getActiveThemeName() === name) {
    const next = themes[0] || defaultTheme;
    setActiveThemeName(next.name);
    applyThemeVariables(next);
  }
}

