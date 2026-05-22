'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const stats = [
  {
    title: 'Revenue (MTD)',
    value: '$124,563',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Sales (MTD)',
    value: '1,847',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Inventory Value',
    value: '$287,450',
    change: '+3.1%',
    trend: 'up',
    icon: Package,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Low Stock Items',
    value: '23',
    change: '-5 from last week',
    trend: 'down',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
];

const topProducts = [
  { name: 'Wireless Mouse', sku: 'SKU001', sold: 234, revenue: 7017.66 },
  { name: 'USB-C Cable', sku: 'SKU002', sold: 189, revenue: 2455.11 },
  { name: 'Cotton T-Shirt', sku: 'SKU003', sold: 156, revenue: 3898.44 },
  { name: 'LED Light Bulb', sku: 'SKU006', sold: 145, revenue: 1013.55 },
  { name: 'Green Tea', sku: 'SKU008', sold: 132, revenue: 2242.68 },
];

const warehousePerformance = [
  { name: 'Main Warehouse', products: 2847, value: 156780, transactions: 1245 },
  { name: 'Distribution Center', products: 1523, value: 89450, transactions: 456 },
  { name: 'Cold Storage', products: 456, value: 41220, transactions: 146 },
];

const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 124563 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.trend === 'up' ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3" />
                    {stat.change}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.title}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2 px-4">
              {revenueData.map((data, i) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    ${(data.revenue / 1000).toFixed(0)}k
                  </div>
                  <div
                    className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                    style={{ height: `${(data.revenue / 130000) * 200}px` }}
                  >
                    <div
                      className="absolute inset-0 bg-primary rounded-t-md"
                      style={{ opacity: 0.3 + (i * 0.15) }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{data.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div
                  key={product.sku}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.sold} sold</div>
                    <div className="text-sm text-muted-foreground">
                      ${product.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehousePerformance.map((wh) => (
              <div
                key={wh.name}
                className="p-4 rounded-lg border border-border/50"
              >
                <h3 className="font-semibold mb-3">{wh.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium">{wh.products.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-medium">${wh.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transactions</span>
                    <span className="font-medium">{wh.transactions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
