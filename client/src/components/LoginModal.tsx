import { useEffect, useState } from "react";
import { AuthModal } from "@/components/AuthModal";

// Mounts a global auth modal and listens for window events
// open-login / close-login dispatched from '@/lib/loginModal'
export default function LoginModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    window.addEventListener("open-login", handleOpen as EventListener);
    window.addEventListener("close-login", handleClose as EventListener);
    return () => {
      window.removeEventListener("open-login", handleOpen as EventListener);
      window.removeEventListener("close-login", handleClose as EventListener);
    };
  }, []);

  return <AuthModal open={open} onOpenChange={setOpen} />;
}


