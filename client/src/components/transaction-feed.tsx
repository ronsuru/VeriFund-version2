import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Box, TrendingUp, TrendingDown, Heart, CheckCircle } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function TransactionFeed() {
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions/recent"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-3 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Helper function to get readable transaction type
  const getTransactionTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'contribution': 'Contribute',
      'tip': 'Tip',
      'claim_tip': 'Claim Tip',
      'claim_contribution': 'Claim Contribution',
      'deposit': 'Deposit',
      'withdrawal': 'Withdraw',
      'withdraw': 'Withdraw',
      'claim_tip_balance': 'Claim Tip Balance',
      'claim_contribution_balance': 'Claim Contribution Balance',
      'fee': 'Platform Fee',
      'refund': 'Refund',
      'transfer': 'Transfer'
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Box className="w-5 h-5" />
          <span>Live Transaction Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto space-y-3">
          {transactions && Array.isArray(transactions) && transactions.length > 0 ? (
            transactions.map((transaction: Transaction) => (
              <div 
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-green-100' :
                      transaction.type === 'withdrawal' || transaction.type === 'withdraw' ? 'bg-blue-100' :
                      transaction.type === 'contribution' ? 'bg-purple-100' :
                      transaction.type === 'tip' ? 'bg-orange-100' :
                      transaction.type.includes('claim') ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {transaction.type === 'deposit' && <TrendingUp className="w-3 h-3 text-green-600" />}
                      {(transaction.type === 'withdrawal' || transaction.type === 'withdraw') && <TrendingDown className="w-3 h-3 text-blue-600" />}
                      {transaction.type === 'contribution' && <Heart className="w-3 h-3 text-purple-600" />}
                      {transaction.type === 'tip' && <Heart className="w-3 h-3 text-orange-600" />}
                      {transaction.type.includes('claim') && <CheckCircle className="w-3 h-3 text-yellow-600" />}
                      {!['deposit', 'withdrawal', 'withdraw', 'contribution', 'tip'].includes(transaction.type) && !transaction.type.includes('claim') && <Box className="w-3 h-3 text-gray-600" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {getTransactionTypeLabel(transaction.type)}
                      </div>
                      <div className="font-semibold text-base text-gray-900">
                        ₱{parseFloat(transaction.amount || '0').toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt!).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {transaction.transactionDisplayId ? (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          <span className="font-mono" data-testid={`transaction-display-id-${transaction.id}`}>
                            {transaction.transactionDisplayId}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground font-mono">
                          {transaction.transactionHash ? transaction.transactionHash.slice(0, 8) + '...' : 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transactions available</p>
            </div>
          )}
        </div>
        {transactions && Array.isArray(transactions) && transactions.length > 0 && (
          <div className="text-center mt-6">
            <button className="text-primary text-sm font-medium hover:underline" data-testid="button-view-all-transactions">
              View All Blockchain Transactions →
            </button>
          </div>
        )}
        
        {/* Transaction Details Modal */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Box className="w-5 h-5" />
                <span>Transaction Details</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedTransaction.type === 'deposit' ? 'bg-green-100' :
                      selectedTransaction.type === 'withdrawal' ? 'bg-blue-100' :
                      selectedTransaction.type === 'contribution' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {selectedTransaction.type === 'deposit' && <TrendingUp className="w-6 h-6 text-green-600" />}
                      {selectedTransaction.type === 'withdrawal' && <TrendingDown className="w-6 h-6 text-blue-600" />}
                      {selectedTransaction.type === 'contribution' && <Heart className="w-6 h-6 text-purple-600" />}
                      {!['deposit', 'withdrawal', 'contribution'].includes(selectedTransaction.type) && <Box className="w-6 h-6 text-gray-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{getTransactionTypeLabel(selectedTransaction.type)}</h3>
                      <p className="text-muted-foreground">{selectedTransaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Transaction ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedTransaction.transactionDisplayId ? (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          <span className="font-mono">{selectedTransaction.transactionDisplayId}</span>
                        </div>
                      ) : (
                        <p className="font-mono break-all text-sm">{selectedTransaction.id}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Date & Time</p>
                    <p>{new Date(selectedTransaction.createdAt!).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Transaction Hash</p>
                    <p className="font-mono break-all">{selectedTransaction.transactionHash || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Status</p>
                    <Badge variant="default">{selectedTransaction.status || 'Completed'}</Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
