'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Package,
  ArrowUpDown,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

const products = [
  { id: '1', sku: 'SKU001', name: 'Wireless Mouse', category: 'Electronics', stock: 150, minStock: 20, price: 29.99, status: 'in_stock' },
  { id: '2', sku: 'SKU002', name: 'USB-C Cable', category: 'Electronics', stock: 300, minStock: 50, price: 12.99, status: 'in_stock' },
  { id: '3', sku: 'SKU003', name: 'Cotton T-Shirt', category: 'Clothing', stock: 80, minStock: 30, price: 24.99, status: 'in_stock' },
  { id: '4', sku: 'SKU004', name: 'Organic Coffee Beans', category: 'Food & Beverages', stock: 12, minStock: 15, price: 22.99, status: 'low_stock' },
  { id: '5', sku: 'SKU005', name: 'Power Drill', category: 'Hardware', stock: 3, minStock: 5, price: 89.99, status: 'low_stock' },
  { id: '6', sku: 'SKU006', name: 'LED Light Bulb', category: 'Electronics', stock: 500, minStock: 100, price: 6.99, status: 'in_stock' },
  { id: '7', sku: 'SKU007', name: 'Winter Jacket', category: 'Clothing', stock: 8, minStock: 10, price: 79.99, status: 'low_stock' },
  { id: '8', sku: 'SKU008', name: 'Green Tea', category: 'Food & Beverages', stock: 60, minStock: 20, price: 16.99, status: 'in_stock' },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('table');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.status === 'low_stock').length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/acme-logistics/inventory/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{lowStockCount}</div>
              <div className="text-sm text-muted-foreground">Low Stock Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Product <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Stock <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="font-medium">{product.name}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{product.sku}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stock}</span>
                        <span className="text-xs text-muted-foreground">/ {product.minStock} min</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">${product.price}</td>
                    <td className="p-4">
                      <Badge variant={product.status === 'in_stock' ? 'success' : 'warning'}>
                        {product.status === 'in_stock' ? 'In Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/acme-logistics/inventory/${product.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
