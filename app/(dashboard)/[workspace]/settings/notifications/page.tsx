'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, Package, AlertTriangle, Clock, Settings } from 'lucide-react';

const notifications = [
  {
    id: '1',
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Power Drill (SKU005) is below minimum stock level at Main Warehouse. Current: 3, Minimum: 5.',
    read: false,
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Organic Coffee (SKU004) is below minimum stock level at Cold Storage. Current: 12, Minimum: 15.',
    read: false,
    time: '3 hours ago',
  },
  {
    id: '3',
    type: 'system',
    title: 'Welcome!',
    message: 'Welcome to WareHouse Pro. Start by adding your products and warehouses.',
    read: true,
    time: '1 day ago',
  },
  {
    id: '4',
    type: 'order',
    title: 'Order Completed',
    message: 'POS transaction TXN001 completed successfully. Total: $74.77.',
    read: true,
    time: '1 day ago',
  },
];

const typeIcons: Record<string, typeof Bell> = {
  low_stock: AlertTriangle,
  expiry: Clock,
  system: Settings,
  order: Package,
};

const typeColors: Record<string, string> = {
  low_stock: 'text-orange-500 bg-orange-500/10',
  expiry: 'text-yellow-500 bg-yellow-500/10',
  system: 'text-blue-500 bg-blue-500/10',
  order: 'text-green-500 bg-green-500/10',
};

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  const markAsRead = (id: string) => {
    setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setItems(items.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const colorClass = typeColors[notification.type] || 'text-muted-foreground bg-muted';

              return (
                <div
                  key={notification.id}
                  className={`p-4 flex gap-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg h-fit ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </div>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
