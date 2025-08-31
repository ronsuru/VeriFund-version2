import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function PaymentEventsListener() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      const data = event.data || {};
      if (data?.type === 'verifund:paymentSuccess') {
        // Invalidate user and transactions to refresh balances
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        toast({ title: "Deposit successful", description: "Refreshing your balance..." });
      }
      if (data?.type === 'verifund:paymentCancel') {
        toast({ title: "Payment cancelled", description: "You can try again anytime." });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [queryClient, toast]);

  return null;
}


