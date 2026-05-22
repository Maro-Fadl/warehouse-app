'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Download, Eye, Receipt, CreditCard, Banknote, Smartphone } from 'lucide-react';

const transactions = [
  { id: 'TXN001', date: '2026-05-22 14:32', items: 3, subtotal: 67.97, tax: 6.80, total: 74.77, payment: 'card', status: 'completed', cashier: 'John Doe' },
  { id: 'TXN002', date: '2026-05-22 13:15', items: 1, subtotal: 29.99, tax: 3.00, total: 32.99, payment: 'cash', status: 'completed', cashier: 'John Doe' },
  { id: 'TXN003', date: '2026-05-22 11:45', items: 5, subtotal: 156.95, tax: 15.70, total: 172.65, payment: 'digital', status: 'completed', cashier: 'Sarah Manager' },
  { id: 'TXN004', date: '2026-05-22 10:20', items: 2, subtotal: 45.98, tax: 4.60, total: 50.58, payment: 'card', status: 'refunded', cashier: 'John Doe' },
  { id: 'TXN005', date: '2026-05-21 16:55', items: 4, subtotal: 89.96, tax: 9.00, total: 98.96, payment: 'cash', status: 'completed', cashier: 'Sarah Manager' },
];

const paymentIcons: Record<string, typeof CreditCard> = {
  card: CreditCard,
  cash: Banknote,
  digital: Smartphone,
};

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View POS transaction history.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm text-muted-foreground">Today's Transactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">$4,287</div>
            <div className="text-sm text-muted-foreground">Today's Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">$27.48</div>
            <div className="text-sm text-muted-foreground">Average Sale</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-muted-foreground">Refunds</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Items</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Payment</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cashier</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const PaymentIcon = paymentIcons[txn.payment] || CreditCard;
                  return (
                    <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-4 font-mono text-sm">{txn.id}</td>
                      <td className="p-4 text-sm">{txn.date}</td>
                      <td className="p-4 text-sm">{txn.items}</td>
                      <td className="p-4 font-medium">${txn.total.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{txn.payment}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={txn.status === 'completed' ? 'success' : 'destructive'}>
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{txn.cashier}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
