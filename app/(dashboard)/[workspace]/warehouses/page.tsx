'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Warehouse, MapPin, Package, Users, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

const warehouses = [
  {
    id: '1',
    name: 'Main Warehouse',
    address: '123 Industrial Blvd',
    city: 'New York',
    country: 'US',
    products: 2847,
    users: 5,
    status: 'active',
  },
  {
    id: '2',
    name: 'Distribution Center',
    address: '456 Logistics Ave',
    city: 'Los Angeles',
    country: 'US',
    products: 1523,
    users: 3,
    status: 'active',
  },
  {
    id: '3',
    name: 'Cold Storage',
    address: '789 Refrigeration St',
    city: 'Chicago',
    country: 'US',
    products: 456,
    users: 2,
    status: 'active',
  },
];

export default function WarehousesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground">Manage your warehouse locations.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse, i) => (
          <motion.div
            key={warehouse.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={`/acme-logistics/warehouses/${warehouse.id}`}>
              <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{warehouse.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    {warehouse.address}, {warehouse.city}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="text-2xl font-bold">{warehouse.products.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{warehouse.users}</div>
                      <div className="text-xs text-muted-foreground">Team Members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}

        {/* Add New Warehouse Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Add Warehouse</h3>
              <p className="text-sm text-muted-foreground">
                Create a new warehouse location
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
