import { useEffect } from "react";
import { Link } from "wouter";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancel() {
  useEffect(() => {
    // Notify opener and close this window if it was opened as a popup
    try {
      if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage(
          { type: 'verifund:paymentCancel' },
          window.location.origin
        );
      }
      setTimeout(() => {
        try { window.close(); } catch {}
      }, 150);
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl text-orange-700">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-gray-600 mb-2">
              Your payment has been cancelled. No charges were made to your account.
            </p>
            <p className="text-sm text-gray-500">
              You can try again anytime.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full" data-testid="button-try-again">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Deposit
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-return-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}