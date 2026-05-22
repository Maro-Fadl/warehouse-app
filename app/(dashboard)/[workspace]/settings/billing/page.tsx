'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Download, CreditCard, Calendar, ArrowUpRight } from 'lucide-react';

const currentPlan = {
  name: 'Retail / POS',
  price: 29,
  period: 'month',
  features: [
    '5 Warehouses',
    '10 Users',
    '5,000 Products',
    '3 POS Terminals',
    '100 AI Queries/day',
    'Advanced Analytics',
    'Barcode Scanning',
    'Priority Support',
  ],
  usage: {
    warehouses: { current: 3, max: 5 },
    users: { current: 4, max: 10 },
    products: { current: 2847, max: 5000 },
    posTerminals: { current: 2, max: 3 },
  },
};

const invoices = [
  { id: 'INV001', date: '2026-05-01', amount: 29.00, status: 'paid' },
  { id: 'INV002', date: '2026-04-01', amount: 29.00, status: 'paid' },
  { id: 'INV003', date: '2026-03-01', amount: 29.00, status: 'paid' },
  { id: 'INV004', date: '2026-02-01', amount: 29.00, status: 'paid' },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and invoices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div>
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="text-2xl font-bold">{currentPlan.name}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${currentPlan.price}</div>
                <div className="text-sm text-muted-foreground">/{currentPlan.period}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentPlan.usage).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg border border-border/50">
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xl font-bold">
                    {value.current.toLocaleString()} / {value.max.toLocaleString()}
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(value.current / value.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
              <Button variant="outline">Manage Subscription</Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Visa ending in 4242</div>
                  <div className="text-sm text-muted-foreground">Expires 12/2027</div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Update Payment Method
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Next billing date: June 1, 2026
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-mono text-sm">{invoice.id}</td>
                    <td className="p-4 text-sm">{invoice.date}</td>
                    <td className="p-4 font-medium">${invoice.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant="success">{invoice.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
