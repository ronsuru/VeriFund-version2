import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

export default function FeeCalculator() {
  const [amount, setAmount] = useState(1000);

  const platformFee = amount * 0.038;
  const conversionFee = amount * 0.01;
  const withdrawalFee = 20; // Fixed fee
  const tipsFee = amount * 0.01;
  const total = amount - platformFee - conversionFee;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Transparent Fee Structure</h2>
          <p className="text-lg text-muted-foreground">
            Our fees are clearly displayed and help maintain platform security and transparency
          </p>
        </div>
        
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-6">Platform Fees</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Platform Fee</div>
                      <div className="text-sm text-muted-foreground">Applied when funds are released</div>
                    </div>
                    <div className="text-xl font-bold text-primary" data-testid="fee-platform">3.8%</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Conversion Fee</div>
                      <div className="text-sm text-muted-foreground">PHP ↔ PHP conversion</div>
                    </div>
                    <div className="text-xl font-bold text-primary" data-testid="fee-conversion">1.0%</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Withdrawal Fee</div>
                      <div className="text-sm text-muted-foreground">Bank/e-wallet transfer</div>
                    </div>
                    <div className="text-xl font-bold text-primary" data-testid="fee-withdrawal">₱20</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Tips Fee</div>
                      <div className="text-sm text-muted-foreground">Supporting creators directly</div>
                    </div>
                    <div className="text-xl font-bold text-primary" data-testid="fee-tips">1.0%</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6">Fee Calculator</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (PHP)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="1,000"
                      className="text-lg"
                      data-testid="input-calculator-amount"
                    />
                  </div>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your donation:</span>
                        <span className="font-medium" data-testid="calculator-donation">
                          ₱{amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Platform fee (3.8%):</span>
                        <span data-testid="calculator-platform-fee">₱{platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Conversion fee (1%):</span>
                        <span data-testid="calculator-conversion-fee">₱{conversionFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total to beneficiary:</span>
                        <span className="text-secondary" data-testid="calculator-total">
                          ₱{total.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Fees support platform security and transparency features
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
