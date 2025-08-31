import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  ThemeConfig,
  ThemeMode,
  editableTokens,
  loadThemes,
  saveThemes,
  generateCss,
  applyThemeVariables,
  getActiveThemeName,
  setActiveThemeName,
  setMode,
  getStoredTheme,
  createNewTheme,
  deleteTheme,
} from "@/lib/theme";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function ThemeConfiguratorModal({ open, onOpenChange }: Props) {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [activeThemeName, setActiveName] = useState<string>('Default');
  const [mode, setLocalMode] = useState<ThemeMode>('light');
  const [working, setWorking] = useState<ThemeConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const list = loadThemes();
    setThemes(list);
    const active = getActiveThemeName();
    setActiveName(active);
    setLocalMode(getStoredTheme() || 'light');
    const current = list.find(t => t.name === active) || list[0] || null;
    setWorking(current ? JSON.parse(JSON.stringify(current)) : null);
  }, [open]);

  const tokenList = useMemo(() => editableTokens, []);

  const handlePick = (token: string, value: string) => {
    if (!working) return;
    const next = { ...working, [mode]: { ...working[mode], [token]: value } } as ThemeConfig;
    setWorking(next);
    applyThemeVariables(next);
  };

  const handleSwitchMode = (m: ThemeMode) => {
    setLocalMode(m);
    setMode(m);
  };

  const handleSelectTheme = (name: string) => {
    setActiveName(name);
    setActiveThemeName(name);
    const t = themes.find(x => x.name === name) || null;
    setWorking(t ? JSON.parse(JSON.stringify(t)) : null);
    if (t) applyThemeVariables(t);
  };

  const handleSave = () => {
    try {
      if (!working) return;
      const next = themes.map(t => (t.name === working.name ? working : t));
      setThemes(next);
      saveThemes(next);
      applyThemeVariables(working);
      toast({ title: 'Theme saved', description: `Applied "${working.name}"` });
    } catch (err) {
      console.error('Failed to save theme:', err);
      toast({ title: 'Failed to save theme', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleAdd = () => {
    try {
      const name = prompt('New theme name?');
      if (!name) return;
      const created = createNewTheme(name, activeThemeName);
      const list = loadThemes();
      setThemes(list);
      setActiveName(created.name);
      setActiveThemeName(created.name);
      setWorking(JSON.parse(JSON.stringify(created)));
      applyThemeVariables(created);
      toast({ title: 'Theme created', description: `"${created.name}" is now active.` });
    } catch (err) {
      console.error('Failed to create theme:', err);
      toast({ title: 'Failed to create theme', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = () => {
    try {
      if (!working) return;
      if (!confirm(`Delete theme "${working.name}"?`)) return;
      deleteTheme(working.name);
      const list = loadThemes();
      setThemes(list);
      const active = getActiveThemeName();
      setActiveName(active);
      const next = list.find(t => t.name === active) || list[0] || null;
      setWorking(next ? JSON.parse(JSON.stringify(next)) : null);
      if (next) applyThemeVariables(next);
      toast({ title: 'Theme deleted', description: `Removed "${working.name}"` });
    } catch (err) {
      console.error('Failed to delete theme:', err);
      toast({ title: 'Failed to delete theme', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
        <DialogHeader>
          <DialogTitle>Theme Configurator</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="min-w-24">Active Theme</Label>
              <Select value={activeThemeName} onValueChange={handleSelectTheme}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map(t => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAdd} className="ml-2">
                <Plus className="w-4 h-4 mr-1" /> Add Theme
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete} className="ml-1" disabled={!working || working.name === 'Default'}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>

            <Tabs value={mode} onValueChange={(v) => handleSwitchMode(v as ThemeMode)}>
              <TabsList>
                <TabsTrigger value="light">Light</TabsTrigger>
                <TabsTrigger value="dark">Dark</TabsTrigger>
              </TabsList>
              <TabsContent value="light" className="mt-4" />
              <TabsContent value="dark" className="mt-4" />
            </Tabs>

            {working && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tokenList.map(token => (
                  <div key={token} className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-card">
                    <div className="flex-1">
                      <Label className="block text-sm font-medium">
                        {token}
                      </Label>
                      <div className="text-xs text-muted-foreground">CSS var: --{token}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/^font-|^radius$/.test(token) ? (
                        <Input
                          value={working[mode][token] || ''}
                          onChange={(e) => handlePick(token, e.target.value)}
                          placeholder={token.startsWith('font-') ? 'CSS font stack' : 'CSS radius (e.g., 1rem)'}
                          className="w-56"
                        />
                      ) : (
                        <>
                          <Input
                            type="color"
                            value={working[mode][token] || '#000000'}
                            onChange={(e) => handlePick(token, e.target.value)}
                            className="w-12 h-10 p-1 rounded-md"
                          />
                          <Input
                            value={working[mode][token] || ''}
                            onChange={(e) => handlePick(token, e.target.value)}
                            className="w-36"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


