import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { posTransactionSchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';

// GET /api/[workspace]/pos - Get transactions
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

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

    const result = await query(
      `SELECT
        pt.id, pt.subtotal, pt.tax, pt.discount, pt.total,
        pt.payment_method, pt.status, pt.created_at,
        u.name as cashier_name,
        w.name as warehouse_name,
        COUNT(pti.id) as item_count
       FROM pos_transactions pt
       JOIN users u ON pt.cashier_id = u.id
       JOIN warehouses w ON pt.warehouse_id = w.id
       LEFT JOIN pos_transaction_items pti ON pt.id = pti.transaction_id
       WHERE w.workspace_id = $1
       GROUP BY pt.id, u.name, w.name
       ORDER BY pt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [workspaceId, limit, offset]
    );

    return NextResponse.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/[workspace]/pos - Create transaction
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
    const validation = posTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get workspace
    const wsResult = await query(
      `SELECT id FROM workspaces WHERE slug = $1`,
      [workspace]
    );
    const workspaceId = wsResult.rows[0]?.id;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership and permissions
    const memberResult = await query(
      `SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2`,
      [session.user.id, workspaceId]
    );
    const member = memberResult.rows[0];

    if (!member || !hasPermission(member.role as any, 'pos:process')) {
      return NextResponse.json(
        { error: 'You do not have permission to process sales' },
        { status: 403 }
      );
    }

    // Process transaction in a transaction (database transaction)
    const result = await transaction(async (client) => {
      // Calculate totals
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
        0
      );
      const tax = subtotal * data.taxRate;
      const total = subtotal - data.discount + tax;

      // Create transaction
      const txnResult = await client.query(
        `INSERT INTO pos_transactions (terminal_id, warehouse_id, customer_id, subtotal, tax, discount, total, payment_method, status, cashier_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9)
         RETURNING id, total, created_at`,
        [
          data.terminalId || null,
          data.warehouseId,
          data.customerId || null,
          subtotal,
          tax,
          data.discount,
          total,
          data.paymentMethod,
          session.user.id,
        ]
      );
      const txn = txnResult.rows[0];

      // Create transaction items and update inventory
      for (const item of data.items) {
        const itemTotal = item.unitPrice * item.quantity - item.discount;

        await client.query(
          `INSERT INTO pos_transaction_items (transaction_id, product_id, quantity, unit_price, discount, total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [txn.id, item.productId, item.quantity, item.unitPrice, item.discount, itemTotal]
        );

        // Update inventory
        const invResult = await client.query(
          `UPDATE inventory
           SET quantity = quantity - $1
           WHERE warehouse_id = $2 AND product_id = $3 AND quantity >= $1
           RETURNING quantity`,
          [item.quantity, data.warehouseId, item.productId]
        );

        if (invResult.rows.length === 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        // Record inventory transaction
        await client.query(
          `INSERT INTO inventory_transactions (warehouse_id, product_id, type, quantity, reference_id, reference_type, performed_by, notes)
           VALUES ($1, $2, 'out', $3, $4, 'pos_sale', $5, 'POS sale')`,
          [data.warehouseId, item.productId, item.quantity, txn.id, session.user.id]
        );
      }

      return txn;
    }, workspaceId);

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
