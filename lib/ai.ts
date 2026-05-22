import OpenAI from 'openai';
import { query } from './db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIContext {
  workspaceId: string;
  userId: string;
  warehouseId?: string;
}

/**
 * Get workspace data context for AI queries.
 */
async function getWorkspaceContext(workspaceId: string): Promise<string> {
  // Get summary stats
  const statsResult = await query(
    `SELECT
      (SELECT COUNT(*) FROM products WHERE workspace_id = $1) as total_products,
      (SELECT COUNT(*) FROM products WHERE workspace_id = $1 AND is_active = true) as active_products,
      (SELECT COUNT(*) FROM warehouses WHERE workspace_id = $1) as total_warehouses,
      (SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock) as low_stock_count,
      (SELECT COALESCE(SUM(i.quantity * p.selling_price), 0) FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.workspace_id = $1) as total_inventory_value,
      (SELECT COUNT(*) FROM pos_transactions pt JOIN warehouses w ON pt.warehouse_id = w.id WHERE w.workspace_id = $1 AND pt.created_at >= CURRENT_DATE) as today_transactions,
      (SELECT COALESCE(SUM(pt.total), 0) FROM pos_transactions pt JOIN warehouses w ON pt.warehouse_id = w.id WHERE w.workspace_id = $1 AND pt.created_at >= CURRENT_DATE) as today_revenue`,
    [workspaceId]
  );

  const stats = statsResult.rows[0];

  // Get low stock items
  const lowStockResult = await query(
    `SELECT p.name, p.sku, i.quantity, p.min_stock, w.name as warehouse
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     JOIN warehouses w ON i.warehouse_id = w.id
     WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock
     ORDER BY (i.quantity::float / NULLIF(p.min_stock, 0)) ASC
     LIMIT 10`,
    [workspaceId]
  );

  // Get top selling products (last 30 days)
  const topProductsResult = await query(
    `SELECT p.name, p.sku, SUM(pti.quantity) as sold, SUM(pti.total) as revenue
     FROM pos_transaction_items pti
     JOIN products p ON pti.product_id = p.id
     JOIN pos_transactions pt ON pti.transaction_id = pt.id
     JOIN warehouses w ON pt.warehouse_id = w.id
     WHERE w.workspace_id = $1 AND pt.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY p.id, p.name, p.sku
     ORDER BY sold DESC
     LIMIT 5`,
    [workspaceId]
  );

  let context = `Workspace Inventory Summary:
- Total Products: ${stats.total_products} (${stats.active_products} active)
- Total Warehouses: ${stats.total_warehouses}
- Low Stock Items: ${stats.low_stock_count}
- Total Inventory Value: $${Number(stats.total_inventory_value).toLocaleString()}
- Today's Transactions: ${stats.today_transactions}
- Today's Revenue: $${Number(stats.today_revenue).toLocaleString()}`;

  if (lowStockResult.rows.length > 0) {
    context += `\n\nLow Stock Alerts:
${lowStockResult.rows.map((r: any) => `- ${r.name} (${r.sku}): ${r.quantity}/${r.min_stock} at ${r.warehouse}`).join('\n')}`;
  }

  if (topProductsResult.rows.length > 0) {
    context += `\n\nTop Selling Products (30 days):
${topProductsResult.rows.map((r: any) => `- ${r.name}: ${r.sold} sold, $${Number(r.revenue).toLocaleString()} revenue`).join('\n')}`;
  }

  return context;
}

/**
 * Process an AI query with workspace context.
 */
export async function processAIQuery(
  userQuery: string,
  context: AIContext
): Promise<{ response: string; data?: any }> {
  const workspaceContext = await getWorkspaceContext(context.workspaceId);

  const systemPrompt = `You are WareHouse Pro AI Assistant, a specialized inventory management assistant.

You are currently working with data from a specific workspace. You can ONLY answer questions about this workspace's data.

Current Workspace Context:
${workspaceContext}

Guidelines:
1. Answer questions about inventory, stock levels, sales, and warehouse operations
2. Provide specific numbers and data when available
3. Suggest actionable insights based on the data
4. If asked about data you don't have, explain what information is available
5. For forecasting questions, use trends from the available data
6. Keep responses concise and professional
7. Format numbers with commas for readability
8. Use markdown for better readability when appropriate

You have access to the following data capabilities:
- Product inventory levels across all warehouses
- Low stock alerts and thresholds
- Sales transaction history
- Revenue and financial data
- Warehouse information

You do NOT have access to:
- Other workspaces' data
- User personal information
- Payment details
- External market data`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const response = completion.choices[0]?.message?.content || 'I was unable to process your query.';

  return { response };
}

/**
 * Get suggested queries based on workspace state.
 */
export async function getSuggestedQueries(workspaceId: string): Promise<string[]> {
  const suggestions: string[] = [];

  // Check for low stock
  const lowStockResult = await query(
    `SELECT COUNT(*) FROM inventory i
     JOIN products p ON i.product_id = p.id
     WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock`,
    [workspaceId]
  );

  if (parseInt(lowStockResult.rows[0].count) > 0) {
    suggestions.push('What products are running low on stock?');
  }

  suggestions.push(
    'What is my total inventory value?',
    'Show me today\'s sales summary',
    'Which products are the top sellers this month?',
    'Forecast stock shortages for next week'
  );

  return suggestions;
}

/**
 * Save a conversation message.
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata: Record<string, any> = {}
) {
  await query(
    `INSERT INTO ai_messages (conversation_id, role, content, metadata)
     VALUES ($1, $2, $3, $4)`,
    [conversationId, role, content, JSON.stringify(metadata)]
  );
}

/**
 * Get or create a conversation.
 */
export async function getOrCreateConversation(
  workspaceId: string,
  userId: string,
  conversationId?: string
): Promise<string> {
  if (conversationId) {
    const result = await query(
      `SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3`,
      [conversationId, workspaceId, userId]
    );
    if (result.rows[0]) {
      return conversationId;
    }
  }

  const result = await query(
    `INSERT INTO ai_conversations (workspace_id, user_id)
     VALUES ($1, $2)
     RETURNING id`,
    [workspaceId, userId]
  );

  return result.rows[0].id;
}
