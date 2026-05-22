import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { aiQuerySchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';
import { canUseAi } from '@/lib/subscriptions';

// GET /api/[workspace]/ai - Get suggested queries
export async function GET(
  request: NextRequest,
  { params }: { params: { workspace: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace } = params;

    // Get workspace
    const wsResult = await query(
      `SELECT id FROM workspaces WHERE slug = $1`,
      [workspace]
    );
    const workspaceId = wsResult.rows[0]?.id;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership
    const memberResult = await query(
      `SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2`,
      [session.user.id, workspaceId]
    );
    if (!memberResult.rows[0]) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build dynamic suggestions based on actual data
    const suggestions = [];

    // Check for low stock
    const lowStockResult = await query(
      `SELECT COUNT(*) FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock AND p.is_active = true`,
      [workspaceId]
    );
    if (parseInt(lowStockResult.rows[0].count) > 0) {
      suggestions.push('What products are running low on stock?');
    }

    // Check for recent sales
    const salesResult = await query(
      `SELECT COUNT(*) FROM pos_transactions pt
       JOIN warehouses w ON pt.warehouse_id = w.id
       WHERE w.workspace_id = $1 AND pt.created_at >= CURRENT_DATE`,
      [workspaceId]
    );
    if (parseInt(salesResult.rows[0].count) > 0) {
      suggestions.push("Show me today's sales summary");
    }

    suggestions.push(
      'What is my total inventory value?',
      'Which products are top sellers this month?',
      'Forecast stock shortages for next week',
      'How many warehouses do I have?'
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/[workspace]/ai - Process AI query
export async function POST(
  request: NextRequest,
  { params }: { params: { workspace: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace } = params;
    const body = await request.json();

    // Validate input
    const validation = aiQuerySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get workspace
    const wsResult = await query(
      `SELECT id, plan_tier FROM workspaces WHERE slug = $1`,
      [workspace]
    );
    const ws = wsResult.rows[0];

    if (!ws) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership and permissions
    const memberResult = await query(
      `SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2`,
      [session.user.id, ws.id]
    );
    const member = memberResult.rows[0];

    if (!member || !hasPermission(member.role as any, 'ai:use')) {
      return NextResponse.json(
        { error: 'You do not have permission to use the AI assistant' },
        { status: 403 }
      );
    }

    // Check AI query limit
    const todayQueriesResult = await query(
      `SELECT COUNT(*) FROM ai_messages am
       JOIN ai_conversations ac ON am.conversation_id = ac.id
       WHERE ac.workspace_id = $1 AND ac.user_id = $2
       AND am.role = 'user' AND am.created_at >= CURRENT_DATE`,
      [ws.id, session.user.id]
    );
    const todayQueries = parseInt(todayQueriesResult.rows[0].count);

    if (!canUseAi(ws.plan_tier as any, todayQueries)) {
      return NextResponse.json(
        { error: 'Daily AI query limit reached. Please upgrade your plan for more queries.' },
        { status: 429 }
      );
    }

    // Get or create conversation
    let conversationId = data.conversationId;
    if (!conversationId) {
      const convResult = await query(
        `INSERT INTO ai_conversations (workspace_id, user_id)
         VALUES ($1, $2)
         RETURNING id`,
        [ws.id, session.user.id]
      );
      conversationId = convResult.rows[0].id;
    }

    // Save user message
    await query(
      `INSERT INTO ai_messages (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [conversationId, data.query]
    );

    // Get workspace context for AI
    const contextResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM products WHERE workspace_id = $1 AND is_active = true) as total_products,
        (SELECT COUNT(*) FROM warehouses WHERE workspace_id = $1 AND is_active = true) as total_warehouses,
        (SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock) as low_stock_count,
        (SELECT COALESCE(SUM(i.quantity * p.selling_price), 0) FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.workspace_id = $1) as total_inventory_value,
        (SELECT COUNT(*) FROM pos_transactions pt JOIN warehouses w ON pt.warehouse_id = w.id WHERE w.workspace_id = $1 AND pt.created_at >= CURRENT_DATE) as today_transactions,
        (SELECT COALESCE(SUM(pt.total), 0) FROM pos_transactions pt JOIN warehouses w ON pt.warehouse_id = w.id WHERE w.workspace_id = $1 AND pt.created_at >= CURRENT_DATE) as today_revenue`,
      [ws.id]
    );
    const stats = contextResult.rows[0];

    // Get low stock items
    const lowStockResult = await query(
      `SELECT p.name, p.sku, i.quantity, p.min_stock, w.name as warehouse
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock AND p.is_active = true
       ORDER BY (i.quantity::float / NULLIF(p.min_stock, 0)) ASC
       LIMIT 10`,
      [ws.id]
    );

    // Get top selling products
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
      [ws.id]
    );

    // Build context string
    let context = `Workspace Inventory Summary:
- Total Products: ${stats.total_products}
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

    // Use OpenAI if available, otherwise provide rule-based responses
    let response = '';

    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are WareHouse Pro AI Assistant. Answer questions about inventory, sales, and warehouse operations based on the provided data. Be concise and helpful. Use markdown for formatting when appropriate.\n\nCurrent Workspace Data:\n${context}`,
            },
            { role: 'user', content: data.query },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        response = completion.choices[0]?.message?.content || 'I was unable to process your query.';
      } catch (aiError: any) {
        console.error('OpenAI error:', aiError.message);
        // Fall back to rule-based response
        response = generateRuleBasedResponse(data.query, stats, lowStockResult.rows, topProductsResult.rows);
      }
    } else {
      // Rule-based responses when no OpenAI key
      response = generateRuleBasedResponse(data.query, stats, lowStockResult.rows, topProductsResult.rows);
    }

    // Save assistant response
    await query(
      `INSERT INTO ai_messages (conversation_id, role, content)
       VALUES ($1, 'assistant', $2)`,
      [conversationId, response]
    );

    return NextResponse.json({
      response,
      conversationId,
    });
  } catch (error: any) {
    console.error('Error processing AI query:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRuleBasedResponse(
  query: string,
  stats: any,
  lowStock: any[],
  topProducts: any[]
): string {
  const q = query.toLowerCase();

  if (q.includes('low stock') || q.includes('running low') || q.includes('shortage')) {
    if (lowStock.length === 0) {
      return 'Great news! No products are currently below their minimum stock levels. Your inventory is well-stocked.';
    }
    let response = `**Low Stock Alert** - ${lowStock.length} items need attention:\n\n`;
    lowStock.forEach((item: any) => {
      const percentage = Math.round((item.quantity / item.min_stock) * 100);
      response += `- **${item.name}** (${item.sku}): ${item.quantity}/${item.min_stock} units at ${item.warehouse} (${percentage}% of minimum)\n`;
    });
    response += '\nConsider restocking these items soon to avoid stockouts.';
    return response;
  }

  if (q.includes('sales') || q.includes('revenue') || q.includes('today')) {
    return `**Today's Sales Summary:**\n\n- Transactions: ${stats.today_transactions}\n- Revenue: $${Number(stats.today_revenue).toLocaleString()}\n- Average Transaction: ${stats.today_transactions > 0 ? '$' + (Number(stats.today_revenue) / stats.today_transactions).toFixed(2) : 'N/A'}`;
  }

  if (q.includes('top seller') || q.includes('best sell') || q.includes('popular')) {
    if (topProducts.length === 0) {
      return 'No sales data available for the current period. Start making sales to see your top products!';
    }
    let response = '**Top Selling Products (Last 30 Days):**\n\n';
    topProducts.forEach((item: any, i: number) => {
      response += `${i + 1}. **${item.name}** - ${item.sold} sold, $${Number(item.revenue).toLocaleString()} revenue\n`;
    });
    return response;
  }

  if (q.includes('inventory value') || q.includes('total value') || q.includes('worth')) {
    return `**Total Inventory Value:** $${Number(stats.total_inventory_value).toLocaleString()}\n\nThis is calculated based on the selling price of all products in stock across ${stats.total_warehouses} warehouse(s).`;
  }

  if (q.includes('warehouse') || q.includes('location')) {
    return `**Warehouse Overview:**\n\n- Total Warehouses: ${stats.total_warehouses}\n- Products Managed: ${stats.total_products}\n- Total Inventory Value: $${Number(stats.total_inventory_value).toLocaleString()}`;
  }

  if (q.includes('forecast') || q.includes('predict') || q.includes('next week')) {
    let response = '**Stock Forecast Analysis:**\n\n';
    if (lowStock.length > 0) {
      response += `${lowStock.length} items are currently below minimum stock levels and may need restocking:\n`;
      lowStock.slice(0, 5).forEach((item: any) => {
        response += `- ${item.name}: ${item.quantity} units remaining\n`;
      });
    } else {
      response += 'All products are currently above minimum stock levels.';
    }
    response += '\n\nFor accurate demand forecasting, consider historical sales patterns and seasonal trends.';
    return response;
  }

  // Default response
  return `**Workspace Summary:**\n\n- Products: ${stats.total_products}\n- Warehouses: ${stats.total_warehouses}\n- Low Stock Items: ${stats.low_stock_count}\n- Inventory Value: $${Number(stats.total_inventory_value).toLocaleString()}\n- Today's Revenue: $${Number(stats.today_revenue).toLocaleString()}\n\nYou can ask me about:\n- Low stock alerts\n- Sales summaries\n- Top selling products\n- Inventory value\n- Warehouse information\n- Stock forecasting`;
}
