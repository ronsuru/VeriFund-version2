import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, CreditCard, Smartphone, Building } from "lucide-react";


const paymentMethods = [
  { value: "gcash", label: "GCash", icon: Smartphone },
  { value: "card", label: "Credit/Debit Card", icon: CreditCard },
];

export function DepositModal({ showText = true, className }: { showText?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fee, setFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const { toast } = useToast();

  // Calculate simple fee directly
  const calculateFee = (depositAmount: string) => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setFee(0);
      return;
    }
    const calculatedFee = Math.max(amount * 0.01, 1); // 1% fee, minimum ₱1
    setFee(calculatedFee);
  };

  // Create deposit
  const createDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/deposits/create", {
        amount: amount,
        paymentMethod: paymentMethod,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("PayMongo Payment Intent Response:", data.paymentIntent);
      
      // Check if PayMongo returned a redirect URL for payment
      if (data.paymentIntent.nextAction?.redirect?.url) {
        toast({
          title: "Redirecting to Payment",
          description: "Opening PayMongo payment page...",
        });
        
        // Open PayMongo payment page in a centered popup window
        const popupWidth = 600;
        const popupHeight = 800;
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : (window as any).screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : (window as any).screenY;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
        const left = dualScreenLeft + Math.max(0, (viewportWidth - popupWidth) / 2);
        const top = dualScreenTop + Math.max(0, (viewportHeight - popupHeight) / 2);

        const features = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`;
        const paymentWindow = window.open(
          data.paymentIntent.nextAction.redirect.url,
          'paymongo-payment',
          features
        );
        
        if (!paymentWindow) {
          // If popup blocked, redirect in same window
          window.location.href = data.paymentIntent.nextAction.redirect.url;
        }
        
      } else {
        toast({
          title: "Payment Created",
          description: "Payment intent created. Please check your notifications for payment instructions.",
        });
      }
      
      // Reset form
      setAmount("");
      setPaymentMethod("");
      setFee(0);
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create deposit",
        variant: "destructive",
      });
    },
  });

  const handleAmountChange = (value: string) => {
    setAmount(value);
    calculateFee(value);
  };

  const handleDeposit = () => {
    if (!amount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    createDepositMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`flex items-center gap-2 ${className || ''}`} data-testid="button-deposit">
          <Wallet className="w-4 h-4" />
          {showText && "Deposit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit PHP to PHP</DialogTitle>
          <DialogDescription>
            Convert Philippine Pesos to PHP cryptocurrency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PHP)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min="1"
              step="0.01"
              data-testid="input-deposit-amount"
            />
          </div>

          {/* Fee Details */}
          {amount && parseFloat(amount) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Conversion Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCalculatingFee ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating fee...
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Amount:</span>
                      <span>₱{Number(amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Fees:</span>
                      <span>₱{Number(fee || 0).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>₱{Number(amount ? parseFloat(amount) + fee : 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-primary">
                      <span>You'll Receive:</span>
                      <span>{Number(amount || 0).toLocaleString()} PHP</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Choose payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Info */}
          {paymentMethod && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">
                    {paymentMethods.find(m => m.value === paymentMethod)?.label}
                  </Badge>
                  <span className="text-muted-foreground">
                    {paymentMethod === "gcash" && "Pay with your GCash wallet"}
                    {paymentMethod === "card" && "Pay with credit or debit card"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-testid="button-cancel-deposit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!amount || !paymentMethod || parseFloat(amount) <= 0 || createDepositMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-deposit"
            >
              {createDepositMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Deposit ₱" + (amount ? (parseFloat(amount) + fee).toLocaleString() : "0")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}