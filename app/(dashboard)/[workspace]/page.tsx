'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Warehouse,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  {
    title: 'Total Products',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Package,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Active Warehouses',
    value: '3',
    change: 'All operational',
    trend: 'neutral',
    icon: Warehouse,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Revenue (MTD)',
    value: '$124,563',
    change: '+8.2%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Low Stock Items',
    value: '23',
    change: '-5 from yesterday',
    trend: 'down',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
];

const recentActivity = [
  { id: 1, action: 'Stock In', product: 'Wireless Mouse', qty: '+150', warehouse: 'Main Warehouse', time: '2 min ago' },
  { id: 2, action: 'Sale', product: 'USB-C Cable', qty: '-25', warehouse: 'Main Warehouse', time: '15 min ago' },
  { id: 3, action: 'Transfer', product: 'Cotton T-Shirt', qty: '50', warehouse: 'Main → Distribution', time: '1 hour ago' },
  { id: 4, action: 'Stock In', product: 'Organic Coffee', qty: '+100', warehouse: 'Cold Storage', time: '3 hours ago' },
  { id: 5, action: 'Low Stock', product: 'Power Drill', qty: '3 left', warehouse: 'Main Warehouse', time: '5 hours ago' },
];

const lowStockItems = [
  { name: 'Power Drill', sku: 'SKU005', current: 3, minimum: 5, warehouse: 'Main Warehouse' },
  { name: 'Winter Jacket', sku: 'SKU007', current: 8, minimum: 10, warehouse: 'Main Warehouse' },
  { name: 'Organic Coffee', sku: 'SKU004', current: 12, minimum: 15, warehouse: 'Cold Storage' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, John. Here's your business overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/acme-logistics/inventory/new">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/acme-logistics/pos">
            <Button variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      {stat.change}
                    </Badge>
                  )}
                  {stat.trend === 'down' && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <ArrowDownRight className="h-3 w-3" />
                      {stat.change}
                    </Badge>
                  )}
                  {stat.trend === 'neutral' && (
                    <Badge variant="secondary">{stat.change}</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/acme-logistics/analytics">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.action === 'Stock In' ? 'bg-green-500' :
                      activity.action === 'Sale' ? 'bg-blue-500' :
                      activity.action === 'Transfer' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{activity.product}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.action} &bull; {activity.warehouse}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      activity.qty.startsWith('+') ? 'text-green-500' :
                      activity.qty.startsWith('-') ? 'text-red-500' :
                      ''
                    }`}>
                      {activity.qty}
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Badge variant="destructive">{lowStockItems.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.sku}
                  className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{item.name}</div>
                    <Badge variant="warning" className="text-xs">
                      {item.current}/{item.minimum}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.sku} &bull; {item.warehouse}
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(item.current / item.minimum) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <Link href="/acme-logistics/inventory">
                <Button variant="outline" className="w-full" size="sm">
                  View All Inventory
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
