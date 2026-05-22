'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalProducts: number;
    activeWarehouses: number;
    monthlyRevenue: number;
    lowStockItems: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    product: string;
    qty: string;
    warehouse: string;
    time: string;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    current: number;
    minimum: number;
    warehouse: string;
  }>;
}

export default function DashboardPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [workspaceSlug]);

  const fetchDashboardData = async () => {
    try {
      // Fetch products count
      const productsRes = await fetch(`/api/${workspaceSlug}/products?limit=1`);
      const productsData = await productsRes.json();

      // Fetch warehouses
      const warehousesRes = await fetch(`/api/${workspaceSlug}/warehouses`);
      const warehousesData = await warehousesRes.json();

      // Fetch analytics
      const analyticsRes = await fetch(`/api/${workspaceSlug}/analytics`);
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setData({
        stats: {
          totalProducts: productsData.total || 0,
          activeWarehouses: warehousesData.warehouses?.length || 0,
          monthlyRevenue: analyticsData?.analytics?.revenue?.thisMonth || 0,
          lowStockItems: analyticsData?.analytics?.inventory?.lowStockCount || 0,
        },
        recentActivity: [],
        lowStockItems: [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default data on error
      setData({
        stats: {
          totalProducts: 0,
          activeWarehouses: 0,
          monthlyRevenue: 0,
          lowStockItems: 0,
        },
        recentActivity: [],
        lowStockItems: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Products',
      value: data?.stats.totalProducts.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Active Warehouses',
      value: data?.stats.activeWarehouses.toString() || '0',
      change: 'All operational',
      trend: 'neutral',
      icon: Warehouse,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Revenue (MTD)',
      value: `$${(data?.stats.monthlyRevenue || 0).toLocaleString()}`,
      change: '+8.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Low Stock Items',
      value: data?.stats.lowStockItems.toString() || '0',
      change: data?.stats.lowStockItems ? 'Needs attention' : 'All stocked',
      trend: data?.stats.lowStockItems ? 'down' : 'neutral',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${workspaceSlug}/inventory/new`}>
            <Button size="sm">
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link href={`/${workspaceSlug}/pos`}>
            <Button variant="outline" size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && (
                    <Badge variant="success" className="flex items-center gap-1 text-xs">
                      <ArrowUpRight className="h-3 w-3" />
                      {stat.change}
                    </Badge>
                  )}
                  {stat.trend === 'down' && (
                    <Badge variant="warning" className="flex items-center gap-1 text-xs">
                      <ArrowDownRight className="h-3 w-3" />
                      {stat.change}
                    </Badge>
                  )}
                  {stat.trend === 'neutral' && (
                    <Badge variant="secondary" className="text-xs">{stat.change}</Badge>
                  )}
                </div>
                <div>
                  <div className="text-xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Link href={`/${workspaceSlug}/analytics`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start selling to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
            {data?.lowStockItems && data.lowStockItems.length > 0 && (
              <Badge variant="destructive">{data.lowStockItems.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {data?.lowStockItems && data.lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {data.lowStockItems.map((item) => (
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
                        style={{ width: `${Math.min(100, (item.current / item.minimum) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Link href={`/${workspaceSlug}/inventory`}>
                  <Button variant="outline" className="w-full" size="sm">
                    View All Inventory
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All stocked up!</p>
                <p className="text-sm">No low stock alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
