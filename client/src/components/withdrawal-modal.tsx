import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Wallet, Smartphone, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface WithdrawalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isOpen !== undefined && onClose) {
      // External control
      if (!value) onClose();
    } else {
      // Internal control
      setInternalOpen(value);
    }
  };
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [accountDetails, setAccountDetails] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const withdrawalMutation = useMutation({
    mutationFn: async (withdrawalData: any) => {
      console.log('🏦 Creating withdrawal:', withdrawalData);
      return await apiRequest("POST", "/api/withdrawals/create", withdrawalData);
    },
    onSuccess: (data) => {
      console.log('✅ Withdrawal created:', data);
      toast({
        title: "Withdrawal Request Submitted! 🎉",
        description: "Your withdrawal request has been submitted for processing.",
      });
      
      // Update cached user values; avoid auth refetch loops
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), balance: (prev?.balance ?? 0) }));
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
      
      // No immediate refetch of auth
      queryClient.refetchQueries({ queryKey: ["/api/transactions/user"] });
      
      handleReset();
      setOpen(false);
    },
    onError: (error) => {
      console.error('❌ Withdrawal failed:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      
      // Parse error message properly
      let errorMessage = "Failed to create withdrawal";
      try {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorData = JSON.parse((error as any).message.split(': ')[1] || '{}');
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        errorMessage = (error as any)?.message || errorMessage;
      }
      
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    setAmount("");
    setPaymentMethod("bank_transfer");
    setAccountDetails("");
    setShowSummary(false);
    setQuote(null);
  };

  const getQuote = async (withdrawalAmount: string, method: string) => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setQuote(null);
      return;
    }

    setIsGettingQuote(true);
    try {
      const response = await apiRequest("POST", "/api/conversions/quote", {
        amount: withdrawalAmount,
        fromCurrency: "PHP",
        toCurrency: "PHP",
        paymentMethod: method,
      });
      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error('Error getting quote:', error);
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      
      toast({
        title: "Quote Error",
        description: "Failed to get withdrawal quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGettingQuote(false);
    }
  };

  const handleWithdrawal = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    withdrawalMutation.mutate({
      amount: amount,
      paymentMethod: paymentMethod,
      accountDetails: accountDetails,
    });
  };

  const handleShowSummary = () => {
    if (!amount || parseFloat(amount) <= 0 || !accountDetails.trim()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before viewing summary.",
        variant: "destructive",
      });
      return;
    }
    setShowSummary(true);
  };

  const userBalance = parseFloat((user as any)?.phpBalance || "0");
  
  // Handle amount and payment method changes to get updated quotes
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && parseFloat(value) > 0) {
      getQuote(value, paymentMethod);
    } else {
      setQuote(null);
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (amount && parseFloat(amount) > 0) {
      getQuote(amount, method);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        handleReset();
      }
    }}>
      {/* Only show trigger button if not externally controlled */}
      {isOpen === undefined && (
        <DialogTrigger asChild>
          <Button className="w-full" data-testid="button-withdraw-php">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Withdraw PHP Balance
          </DialogTitle>
          <DialogDescription>
            Withdraw your PHP balance to your preferred payment method.
          </DialogDescription>
        </DialogHeader>

        {!showSummary ? (
          <div className="space-y-6">
            {/* Withdrawable Balance */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Withdrawable Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₱{userBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Available for withdrawal</div>
                </div>
              </CardContent>
            </Card>

            {/* KYC Check */}
            {(user as any)?.kycStatus !== "verified" && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>KYC Required:</strong> Complete your identity verification to enable withdrawals.
                </AlertDescription>
              </Alert>
            )}

            {/* Input Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">Input Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter withdrawal amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                max={userBalance}
                min="100"
                disabled={(user as any)?.kycStatus !== "verified"}
                data-testid="input-withdrawal-amount"
                className="text-lg p-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum: ₱100</span>
                <span>Maximum: ₱{userBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* Choose Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-base font-semibold">Payment Method</Label>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> All withdrawals are processed via bank transfer through the InstaPay network. 
                  If you have GCash, ensure your GCash account is linked to a bank account that can receive InstaPay transfers.
                </p>
              </div>
              <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                <SelectTrigger data-testid="select-payment-method" className="p-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-3 py-1">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Bank Transfer (InstaPay)</div>
                        <div className="text-xs text-muted-foreground">Fast bank transfer via InstaPay network</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Set-up E-wallet / Bank Details */}
            <div className="space-y-2">
              <Label htmlFor="accountDetails" className="text-base font-semibold">
                Bank Account Details
              </Label>
              <Input
                id="accountDetails"
                type="text"
                placeholder="Enter bank account number"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                disabled={(user as any)?.kycStatus !== "verified"}
                data-testid="input-account-details"
                className="text-lg p-3"
              />
              <p className="text-xs text-muted-foreground">
                Enter your complete bank account information for InstaPay transfer
              </p>
            </div>

            {/* Fee Preview */}
            {quote && !isGettingQuote && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Withdrawal Amount:</span>
                      <span className="font-medium">₱{parseFloat(amount).toLocaleString()}</span>
                    </div>
                    {quote.feeBreakdown && (
                      <>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Platform Fee (1%):</span>
                          <span>-₱{quote.feeBreakdown.platformFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Transfer Fee (InstaPay):</span>
                          <span>-₱{quote.feeBreakdown.transferFee.toFixed(2)}</span>
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="flex justify-between items-center font-bold text-green-600">
                      <span>You Will Receive:</span>
                      <span>₱{quote.toAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isGettingQuote && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Calculating fees...</span>
              </div>
            )}

            {/* Show Summary Button */}
            <Button
              onClick={handleShowSummary}
              className="w-full"
              size="lg"
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                (user as any)?.kycStatus !== "verified" ||
                parseFloat(amount || "0") < 100 ||
                parseFloat(amount || "0") > userBalance ||
                !accountDetails.trim() ||
                isGettingQuote ||
                !quote
              }
              data-testid="button-withdrawal-details"
            >
              WITHDRAWAL DETAILS
            </Button>
          </div>
        ) : (
          /* Withdrawal Summary */
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Withdrawal Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Withdrawal Amount:</span>
                    <span className="text-lg font-bold">₱{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment Method:</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Bank Transfer (InstaPay)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account Details:</span>
                    <span className="font-mono text-sm">{accountDetails}</span>
                  </div>
                  <Separator />
                  {quote?.feeBreakdown && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span>Platform Fee (1%):</span>
                        <span>₱{quote.feeBreakdown.platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Transfer Fee (InstaPay):</span>
                        <span>₱{quote.feeBreakdown.transferFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-red-600">
                        <span>Total Fees:</span>
                        <span>₱{quote.fee.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold text-green-700">
                    <span>You Will Receive:</span>
                    <span>₱{quote ? quote.toAmount.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processing time: 1-3 business days. Please ensure your account details are correct before submitting.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSummary(false)}
                className="flex-1"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleWithdrawal}
                disabled={withdrawalMutation.isPending}
                className="flex-1"
                data-testid="button-submit-withdrawal"
              >
                {withdrawalMutation.isPending ? "Processing..." : "SUBMIT"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}