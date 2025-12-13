

"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, ArrowRight } from "lucide-react";
import { IconPaywall } from "@tabler/icons-react";

export default function PaymentPage() {
  const [amount, setAmount] = useState("");

  return (
    <div className="w-full flex justify-center px-4 py-10">
      <Card className="w-full max-w-xl border border-border bg-card shadow-sm rounded-xl">
        <CardHeader>
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <p className="text-muted-foreground text-sm">
            Choose your preferred payment method
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* AMOUNT SECTION */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Enter Amount
            </label>
            <Input
              placeholder="₹ 499"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              className="text-base"
            />
          </div>

          <Separator />

          {/* TABS */}
          <Tabs defaultValue="upi" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="upi" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>UPI</span>
              </TabsTrigger>

              <TabsTrigger value="razorpay" className="flex items-center gap-2">
                <IconPaywall className="w-4 h-4" />
                <span>Razorpay</span>
              </TabsTrigger>

              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Card</span>
              </TabsTrigger>
            </TabsList>

            {/* UPI SECTION */}
            <TabsContent value="upi" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Enter UPI ID
                </label>
                <Input placeholder="example@upi" className="text-base" />
              </div>

              <Button className="w-full">
                Pay with UPI <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </TabsContent>

            {/* RAZORPAY SECTION */}
            <TabsContent value="razorpay" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                You’ll be redirected to Razorpay’s secure payment gateway.
              </p>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Pay with Razorpay <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </TabsContent>

            {/* STRIPE SECTION */}
            <TabsContent value="card" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Card Number
                </label>
                <Input placeholder="4242 4242 4242 4242" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Expiry
                  </label>
                  <Input placeholder="MM/YY" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    CVC
                  </label>
                  <Input placeholder="123" />
                </div>
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Pay with Card <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
