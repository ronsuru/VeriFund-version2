import { useEffect, useState } from 'react';
import { ThemeConfiguratorModal } from '@/components/ThemeConfiguratorModal';

let setOpenRef: ((v: boolean) => void) | null = null;

export function openThemeConfigurator() {
  setOpenRef?.(true);
}

export default function ThemeConfiguratorButtonMount() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpenRef = setOpen;
    (window as any).__openThemeConfigurator = () => setOpen(true);
    return () => { setOpenRef = null; delete (window as any).__openThemeConfigurator; };
  }, []);
  return <ThemeConfiguratorModal open={open} onOpenChange={setOpen} />;
}


