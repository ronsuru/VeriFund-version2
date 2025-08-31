import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CompletePaymentButton() {
  const [transactionId, setTransactionId] = useState("a1485cdd-647f-4caf-457a-898e-68949a5c4e8c");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/deposits/complete", {
        transactionId,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Completed! 🎉",
        description: `${data.phpAmount} PHP tokens have been credited to your account!`,
      });
      
      // Update cached user; avoid auth refetch loops
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), balance: (prev?.balance ?? 0) }));
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete deposit. The transaction may already be completed.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Coins className="w-5 h-5" />
          Complete Your Recent Deposit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-green-700">
            Your payment was successful! Click below to credit the PHP tokens to your account.
            <br />
            <span className="font-mono text-xs">Transaction: {transactionId.slice(0, 20)}...</span>
          </p>
          
          <Button 
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
            data-testid="button-complete-deposit"
          >
            {completeMutation.isPending ? (
              "Processing..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Deposit & Get PHP Tokens
              </>
            )}
          </Button>
          
          {completeMutation.isSuccess && (
            <div className="text-center text-green-700 font-medium">
              ✅ Deposit completed successfully! Check your balance above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}