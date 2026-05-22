import { query } from './db';

export interface AnalyticsData {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  inventory: {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    sold: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    total: number;
    paymentMethod: string;
    createdAt: string;
    cashierName: string;
  }>;
  warehousePerformance: Array<{
    id: string;
    name: string;
    products: number;
    value: number;
    transactions: number;
  }>;
}

/**
 * Get comprehensive analytics data for a workspace.
 */
export async function getWorkspaceAnalytics(
  workspaceId: string,
  period: 'today' | 'week' | 'month' = 'month'
): Promise<AnalyticsData> {
  const dateFilter = {
    today: 'CURRENT_DATE',
    week: "DATE_TRUNC('week', CURRENT_DATE)",
    month: "DATE_TRUNC('month', CURRENT_DATE)",
  }[period];

  // Revenue data
  const revenueResult = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN pt.created_at >= CURRENT_DATE THEN pt.total ELSE 0 END), 0) as today,
      COALESCE(SUM(CASE WHEN pt.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN pt.total ELSE 0 END), 0) as this_week,
      COALESCE(SUM(CASE WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN pt.total ELSE 0 END), 0) as this_month,
      COALESCE(SUM(CASE WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                        AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN pt.total ELSE 0 END), 0) as last_month
     FROM pos_transactions pt
     JOIN warehouses w ON pt.warehouse_id = w.id
     WHERE w.workspace_id = $1 AND pt.status = 'completed'`,
    [workspaceId]
  );

  const revenue = revenueResult.rows[0];
  const revenueTrend = revenue.last_month > 0
    ? ((revenue.this_month - revenue.last_month) / revenue.last_month) * 100
    : 0;

  // Sales count
  const salesResult = await query(
    `SELECT
      COUNT(CASE WHEN pt.created_at >= CURRENT_DATE THEN 1 END) as today,
      COUNT(CASE WHEN pt.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week,
      COUNT(CASE WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month
     FROM pos_transactions pt
     JOIN warehouses w ON pt.warehouse_id = w.id
     WHERE w.workspace_id = $1 AND pt.status = 'completed'`,
    [workspaceId]
  );

  // Inventory stats
  const inventoryResult = await query(
    `SELECT
      COUNT(DISTINCT p.id) as total_products,
      COALESCE(SUM(i.quantity * p.selling_price), 0) as total_value,
      COUNT(DISTINCT CASE WHEN i.quantity <= p.min_stock THEN p.id END) as low_stock_count,
      COUNT(DISTINCT CASE WHEN i.quantity = 0 THEN p.id END) as out_of_stock_count
     FROM products p
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE p.workspace_id = $1 AND p.is_active = true`,
    [workspaceId]
  );

  // Top products
  const topProductsResult = await query(
    `SELECT
      p.id, p.name, p.sku,
      SUM(pti.quantity) as sold,
      SUM(pti.total) as revenue
     FROM pos_transaction_items pti
     JOIN products p ON pti.product_id = p.id
     JOIN pos_transactions pt ON pti.transaction_id = pt.id
     JOIN warehouses w ON pt.warehouse_id = w.id
     WHERE w.workspace_id = $1
     AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
     AND pt.status = 'completed'
     GROUP BY p.id, p.name, p.sku
     ORDER BY sold DESC
     LIMIT 5`,
    [workspaceId]
  );

  // Recent transactions
  const recentTxnResult = await query(
    `SELECT
      pt.id, pt.total, pt.payment_method, pt.created_at,
      u.name as cashier_name
     FROM pos_transactions pt
     JOIN warehouses w ON pt.warehouse_id = w.id
     JOIN users u ON pt.cashier_id = u.id
     WHERE w.workspace_id = $1
     ORDER BY pt.created_at DESC
     LIMIT 10`,
    [workspaceId]
  );

  // Warehouse performance
  const warehousePerfResult = await query(
    `SELECT
      w.id, w.name,
      COUNT(DISTINCT i.product_id) as products,
      COALESCE(SUM(i.quantity * p.selling_price), 0) as value,
      COUNT(DISTINCT pt.id) as transactions
     FROM warehouses w
     LEFT JOIN inventory i ON w.id = i.warehouse_id
     LEFT JOIN products p ON i.product_id = p.id
     LEFT JOIN pos_transactions pt ON w.id = pt.warehouse_id
       AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
       AND pt.status = 'completed'
     WHERE w.workspace_id = $1
     GROUP BY w.id, w.name
     ORDER BY value DESC`,
    [workspaceId]
  );

  return {
    revenue: {
      today: Number(revenue.today),
      thisWeek: Number(revenue.this_week),
      thisMonth: Number(revenue.this_month),
      lastMonth: Number(revenue.last_month),
      trend: revenueTrend,
    },
    sales: {
      today: Number(salesResult.rows[0].today),
      thisWeek: Number(salesResult.rows[0].this_week),
      thisMonth: Number(salesResult.rows[0].this_month),
    },
    inventory: {
      totalProducts: Number(inventoryResult.rows[0].total_products),
      totalValue: Number(inventoryResult.rows[0].total_value),
      lowStockCount: Number(inventoryResult.rows[0].low_stock_count),
      outOfStockCount: Number(inventoryResult.rows[0].out_of_stock_count),
    },
    topProducts: topProductsResult.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      sold: Number(r.sold),
      revenue: Number(r.revenue),
    })),
    recentTransactions: recentTxnResult.rows.map((r: any) => ({
      id: r.id,
      total: Number(r.total),
      paymentMethod: r.payment_method,
      createdAt: r.created_at,
      cashierName: r.cashier_name,
    })),
    warehousePerformance: warehousePerfResult.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      products: Number(r.products),
      value: Number(r.value),
      transactions: Number(r.transactions),
    })),
  };
}

/**
 * Get daily revenue for chart display.
 */
export async function getDailyRevenue(workspaceId: string, days: number = 30) {
  const result = await query(
    `SELECT
      DATE(pt.created_at) as date,
      SUM(pt.total) as revenue,
      COUNT(*) as transactions
     FROM pos_transactions pt
     JOIN warehouses w ON pt.warehouse_id = w.id
     WHERE w.workspace_id = $1
     AND pt.created_at >= CURRENT_DATE - INTERVAL '${days} days'
     AND pt.status = 'completed'
     GROUP BY DATE(pt.created_at)
     ORDER BY date ASC`,
    [workspaceId]
  );

  return result.rows.map((r: any) => ({
    date: r.date,
    revenue: Number(r.revenue),
    transactions: Number(r.transactions),
  }));
}
