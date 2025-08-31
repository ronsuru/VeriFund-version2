import { useEffect, useState } from 'react';
import CreateCampaignModal from '@/components/CreateCampaignModal';

let setOpenRef: ((v: boolean) => void) | null = null;
let setPrefillRef: ((v: any) => void) | null = null;

export function openCreateCampaign(data?: any) {
  setPrefillRef?.(data || null);
  setOpenRef?.(true);
}

export default function CreateCampaignModalMount() {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);
  useEffect(() => {
    setOpenRef = setOpen;
    setPrefillRef = setPrefill;
    (window as any).__openCreateCampaign = (data?: any) => {
      setPrefill(data || (window as any).__campaignDraftPrefill || null);
      setOpen(true);
    };
    return () => { setOpenRef = null; setPrefillRef = null; delete (window as any).__openCreateCampaign; };
  }, []);
  return <CreateCampaignModal open={open} onOpenChange={(v)=>{ if(!v) setPrefill(null); setOpen(v);} } prefill={prefill} />;
}


