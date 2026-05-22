import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { warehouseSchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';
import { canAddResource } from '@/lib/subscriptions';

// GET /api/[workspace]/warehouses - List warehouses
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

    // Get warehouses with stats
    const result = await query(
      `SELECT
        w.id, w.name, w.address, w.city, w.country, w.lat, w.lng, w.is_active,
        w.settings, w.created_at, w.updated_at,
        COUNT(DISTINCT i.product_id) as product_count,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COUNT(DISTINCT wm2.user_id) as member_count
       FROM warehouses w
       LEFT JOIN inventory i ON w.id = i.warehouse_id
       LEFT JOIN workspace_members wm2 ON w.workspace_id = wm2.workspace_id
       WHERE w.workspace_id = $1 AND w.is_active = true
       GROUP BY w.id
       ORDER BY w.created_at ASC`,
      [workspaceId]
    );

    return NextResponse.json({ warehouses: result.rows });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/[workspace]/warehouses - Create warehouse
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
    const validation = warehouseSchema.safeParse(body);
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

    if (!member || !hasPermission(member.role as any, 'warehouse:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to create warehouses' },
        { status: 403 }
      );
    }

    // Check warehouse limit
    const countResult = await query(
      `SELECT COUNT(*) FROM warehouses WHERE workspace_id = $1 AND is_active = true`,
      [ws.id]
    );
    const warehouseCount = parseInt(countResult.rows[0].count);

    if (!canAddResource(ws.plan_tier as any, 'warehouses', warehouseCount)) {
      return NextResponse.json(
        { error: 'Warehouse limit reached for your plan. Please upgrade.' },
        { status: 403 }
      );
    }

    // Create warehouse
    const result = await query(
      `INSERT INTO warehouses (workspace_id, name, address, city, country, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, address, city, country, created_at`,
      [
        ws.id,
        data.name,
        data.address,
        data.city,
        data.country,
        data.lat || null,
        data.lng || null,
      ]
    );

    return NextResponse.json({ warehouse: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/[workspace]/warehouses - Update warehouse
export async function PUT(
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Warehouse ID is required' }, { status: 400 });
    }

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

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }
    if (updateData.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(updateData.address);
    }
    if (updateData.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(updateData.city);
    }
    if (updateData.country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(updateData.country);
    }
    if (updateData.lat !== undefined) {
      updates.push(`lat = $${paramIndex++}`);
      values.push(updateData.lat);
    }
    if (updateData.lng !== undefined) {
      updates.push(`lng = $${paramIndex++}`);
      values.push(updateData.lng);
    }
    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(updateData.isActive);
    }
    if (updateData.settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.settings));
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

// DELETE /api/[workspace]/warehouses - Delete warehouse
export async function DELETE(
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
    const warehouseId = searchParams.get('id');

    if (!warehouseId) {
      return NextResponse.json({ error: 'Warehouse ID is required' }, { status: 400 });
    }

    // Get workspace
    const wsResult = await query(
      `SELECT id FROM workspaces WHERE slug = $1`,
      [workspace]
    );
    const ws = wsResult.rows[0];

    if (!ws) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership and permissions (only owner can delete warehouses)
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
      [warehouseId, ws.id]
    );
    if (!warehouseCheck.rows[0]) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Check if warehouse has inventory
    const inventoryCheck = await query(
      `SELECT SUM(quantity) as total FROM inventory WHERE warehouse_id = $1`,
      [warehouseId]
    );
    const totalStock = parseInt(inventoryCheck.rows[0]?.total || '0');

    if (totalStock > 0) {
      // Soft delete if has stock
      await query(
        `UPDATE warehouses SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [warehouseId]
      );
      return NextResponse.json({
        message: 'Warehouse deactivated (has inventory)',
        softDelete: true,
      });
    }

    // Hard delete if no stock
    await query(`DELETE FROM warehouses WHERE id = $1`, [warehouseId]);

    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
