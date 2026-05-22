import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

// GET /api/[workspace]/warehouses/[id] - Get single warehouse
export async function GET(
  request: NextRequest,
  { params }: { params: { workspace: string; id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace, id } = params;

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

    // Get warehouse details
    const result = await query(
      `SELECT
        w.id, w.name, w.address, w.city, w.country, w.lat, w.lng,
        w.is_active, w.settings, w.created_at, w.updated_at
       FROM warehouses w
       WHERE w.id = $1 AND w.workspace_id = $2`,
      [id, workspaceId]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Get inventory summary
    const inventoryResult = await query(
      `SELECT
        COUNT(DISTINCT i.product_id) as total_products,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COALESCE(SUM(i.quantity * p.selling_price), 0) as total_value,
        COUNT(DISTINCT CASE WHEN i.quantity <= p.min_stock THEN p.id END) as low_stock_count
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.warehouse_id = $1 AND p.is_active = true`,
      [id]
    );

    // Get products in this warehouse
    const productsResult = await query(
      `SELECT
        p.id, p.sku, p.name, p.selling_price,
        i.quantity, i.reserved_quantity, i.shelf_location
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.warehouse_id = $1 AND p.is_active = true
       ORDER BY p.name
       LIMIT 50`,
      [id]
    );

    // Get team members assigned to this warehouse
    const membersResult = await query(
      `SELECT u.id, u.name, u.email, u.avatar
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1
       ORDER BY u.name`,
      [workspaceId]
    );

    return NextResponse.json({
      warehouse: result.rows[0],
      inventory: inventoryResult.rows[0],
      products: productsResult.rows,
      members: membersResult.rows,
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/[workspace]/warehouses/[id] - Update warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: { workspace: string; id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace, id } = params;
    const body = await request.json();

    // Get workspace
    const wsResult = await query(
      `SELECT id FROM workspaces WHERE slug = $1`,
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

    if (!member || !hasPermission(member.role as any, 'warehouse:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to update warehouses' },
        { status: 403 }
      );
    }

    // Verify warehouse belongs to workspace
    const warehouseCheck = await query(
      `SELECT id FROM warehouses WHERE id = $1 AND workspace_id = $2`,
      [id, ws.id]
    );
    if (!warehouseCheck.rows[0]) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'address', 'city', 'country', 'lat', 'lng', 'isActive', 'settings'];
    const fieldMap: Record<string, string> = {
      isActive: 'is_active',
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const dbField = fieldMap[field] || field;
        updates.push(`${dbField} = $${paramIndex++}`);
        values.push(field === 'settings' ? JSON.stringify(body[field]) : body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE warehouses SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, address, city, country, updated_at`,
      values
    );

    return NextResponse.json({ warehouse: result.rows[0] });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/[workspace]/warehouses/[id] - Delete warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspace: string; id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace, id } = params;

    // Get workspace
    const wsResult = await query(
      `SELECT id FROM workspaces WHERE slug = $1`,
      [workspace]
    );
    const ws = wsResult.rows[0];

    if (!ws) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership and permissions (only owner can delete)
    const memberResult = await query(
      `SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2`,
      [session.user.id, ws.id]
    );
    const member = memberResult.rows[0];

    if (!member || member.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only workspace owners can delete warehouses' },
        { status: 403 }
      );
    }

    // Verify warehouse belongs to workspace
    const warehouseCheck = await query(
      `SELECT id FROM warehouses WHERE id = $1 AND workspace_id = $2`,
      [id, ws.id]
    );
    if (!warehouseCheck.rows[0]) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Check if warehouse has inventory
    const inventoryCheck = await query(
      `SELECT SUM(quantity) as total FROM inventory WHERE warehouse_id = $1`,
      [id]
    );
    const totalStock = parseInt(inventoryCheck.rows[0]?.total || '0');

    if (totalStock > 0) {
      // Soft delete if has stock
      await query(
        `UPDATE warehouses SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [id]
      );
      return NextResponse.json({
        message: 'Warehouse deactivated (has inventory)',
        softDelete: true,
      });
    }

    // Hard delete if no stock
    await query(`DELETE FROM warehouses WHERE id = $1`, [id]);

    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
