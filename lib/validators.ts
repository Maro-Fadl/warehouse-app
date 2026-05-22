import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Workspace schemas
export const workspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['manager', 'storekeeper', 'cashier']),
});

// Product schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(50),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid().optional(),
  unit: z.string().min(1, 'Unit is required'),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Warehouse schemas
export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100),
  address: z.string().min(1, 'Address is required').max(300),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

// Inventory schemas
export const inventoryAdjustmentSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment']),
  notes: z.string().max(500).optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

// POS schemas
export const posTransactionSchema = z.object({
  warehouseId: z.string().uuid(),
  terminalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
  })).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cash', 'card', 'digital']),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(1).default(0),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
});

// Settings schemas
export const workspaceSettingsSchema = z.object({
  currency: z.string().length(3).default('USD'),
  taxRate: z.number().min(0).max(1).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  expiryWarningDays: z.number().int().min(1).default(30),
  timezone: z.string().default('UTC'),
  dateFormat: z.string().default('MM/dd/yyyy'),
});

export const notificationPreferencesSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  lowStock: z.boolean().default(true),
  expiry: z.boolean().default(true),
  orders: z.boolean().default(true),
  system: z.boolean().default(true),
});

// AI schemas
export const aiQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000),
  conversationId: z.string().uuid().optional(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type PosTransactionInput = z.infer<typeof posTransactionSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
