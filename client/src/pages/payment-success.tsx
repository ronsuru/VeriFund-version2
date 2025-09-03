import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowLeft, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const sessionId = queryParams.get('session_id');

  const notifyParent = () => {
    try {
      if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage(
          { type: 'verifund:paymentSuccess', sessionId },
          window.location.origin
        );
      }
    } catch {}
  };

  const closePopup = () => {
    notifyParent();
    try { 
      window.close(); 
    } catch {
      // If window.close() fails (e.g., on mobile), redirect to home
      window.location.href = '/';
    }
  };

  useEffect(() => {
    // Notify opener immediately, auto-close after 5 seconds
    notifyParent();
    const timer = setTimeout(() => closePopup(), 5000);
    
    return () => clearTimeout(timer);
    // Also log for debugging
    console.log('Payment completed successfully:', sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 p-6">
          <div>
            <p className="text-gray-600 mb-2">
              Your deposit has been processed successfully.
            </p>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
              <Coins className="w-5 h-5" />
              <span>PHP tokens will be added to your balance shortly.</span>
            </div>
          </div>
          
          {sessionId && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Transaction ID:</p>
              <p className="text-xs font-mono text-gray-800">{sessionId.slice(0, 20)}...</p>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">This window will close automatically in 5 seconds.</p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={closePopup} 
                className="w-full h-12 text-base font-medium" 
                data-testid="button-return-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}