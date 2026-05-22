'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Package, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

const product = {
  id: '1',
  sku: 'SKU001',
  name: 'Wireless Mouse',
  description: 'Ergonomic wireless mouse with USB receiver. Features adjustable DPI settings and long battery life.',
  category: 'Electronics',
  unit: 'pcs',
  minStock: 20,
  maxStock: 500,
  costPrice: 15.00,
  sellingPrice: 29.99,
  barcode: '1234567890123',
  status: 'in_stock',
  createdAt: '2026-01-15',
};

const inventory = [
  { warehouse: 'Main Warehouse', quantity: 150, reserved: 10, shelf: 'A-1-1', lastRestocked: '2026-05-20' },
  { warehouse: 'Distribution Center', quantity: 80, reserved: 0, shelf: 'B-2-3', lastRestocked: '2026-05-18' },
  { warehouse: 'Cold Storage', quantity: 20, reserved: 0, shelf: 'C-1-1', lastRestocked: '2026-05-15' },
];

const transactions = [
  { id: '1', type: 'in', quantity: 150, warehouse: 'Main Warehouse', date: '2026-05-20', notes: 'Restock from supplier' },
  { id: '2', type: 'out', quantity: 25, warehouse: 'Main Warehouse', date: '2026-05-19', notes: 'POS sale' },
  { id: '3', type: 'transfer', quantity: 50, warehouse: 'Main → Distribution', date: '2026-05-18', notes: 'Inter-warehouse transfer' },
  { id: '4', type: 'out', quantity: 10, warehouse: 'Distribution Center', date: '2026-05-17', notes: 'Online order fulfillment' },
];

export default function ProductDetailPage() {
  const totalStock = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
  const totalReserved = inventory.reduce((sum, inv) => sum + inv.reserved, 0);
  const totalValue = totalStock * product.sellingPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/acme-logistics/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <Badge variant={product.status === 'in_stock' ? 'success' : 'warning'}>
                {product.status === 'in_stock' ? 'In Stock' : 'Low Stock'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{product.sku} &bull; {product.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">SKU</div>
                <div className="font-medium">{product.sku}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="font-medium">{product.category}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unit</div>
                <div className="font-medium">{product.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Barcode</div>
                <div className="font-medium font-mono text-sm">{product.barcode}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Cost Price</div>
                <div className="font-medium">${product.costPrice}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Selling Price</div>
                <div className="font-medium">${product.sellingPrice}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Min Stock</div>
                <div className="font-medium">{product.minStock} {product.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max Stock</div>
                <div className="font-medium">{product.maxStock} {product.unit}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-500/10 text-center">
              <div className="text-3xl font-bold text-blue-500">{totalStock}</div>
              <div className="text-sm text-muted-foreground">Total Stock</div>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 text-center">
              <div className="text-3xl font-bold text-orange-500">{totalReserved}</div>
              <div className="text-sm text-muted-foreground">Reserved</div>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 text-center">
              <div className="text-3xl font-bold text-green-500">${totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory by Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory by Warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventory.map((inv) => (
              <div
                key={inv.warehouse}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{inv.warehouse}</div>
                    <div className="text-sm text-muted-foreground">Shelf: {inv.shelf}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-medium">{inv.quantity} units</div>
                    <div className="text-sm text-muted-foreground">{inv.reserved} reserved</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Last restocked</div>
                    <div className="text-sm">{inv.lastRestocked}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    txn.type === 'in' ? 'bg-green-500/10' :
                    txn.type === 'out' ? 'bg-red-500/10' :
                    'bg-purple-500/10'
                  }`}>
                    {txn.type === 'in' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : txn.type === 'out' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Package className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm capitalize">{txn.type}</div>
                    <div className="text-xs text-muted-foreground">{txn.notes}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    txn.type === 'in' ? 'text-green-500' :
                    txn.type === 'out' ? 'text-red-500' :
                    'text-purple-500'
                  }`}>
                    {txn.type === 'in' ? '+' : txn.type === 'out' ? '-' : ''}{txn.quantity}
                  </div>
                  <div className="text-xs text-muted-foreground">{txn.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
