import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

// GET /api/[workspace]/products/[id] - Get single product
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

    // Get product with inventory details
    const result = await query(
      `SELECT
        p.id, p.sku, p.name, p.description, p.unit, p.min_stock, p.max_stock,
        p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active,
        p.created_at, p.updated_at,
        pc.name as category_name, pc.id as category_id
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = $1 AND p.workspace_id = $2`,
      [id, workspaceId]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get inventory by warehouse
    const inventoryResult = await query(
      `SELECT
        i.id, i.warehouse_id, i.quantity, i.reserved_quantity, i.shelf_location, i.last_restocked_at,
        w.name as warehouse_name
       FROM inventory i
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.product_id = $1 AND w.workspace_id = $2
       ORDER BY w.name`,
      [id, workspaceId]
    );

    // Get recent transactions
    const transactionsResult = await query(
      `SELECT
        it.id, it.type, it.quantity, it.notes, it.created_at,
        w.name as warehouse_name,
        u.name as performed_by_name
       FROM inventory_transactions it
       JOIN warehouses w ON it.warehouse_id = w.id
       JOIN users u ON it.performed_by = u.id
       WHERE it.product_id = $1 AND w.workspace_id = $2
       ORDER BY it.created_at DESC
       LIMIT 20`,
      [id, workspaceId]
    );

    return NextResponse.json({
      product: result.rows[0],
      inventory: inventoryResult.rows,
      transactions: transactionsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/[workspace]/products/[id] - Update product
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

    if (!member || !hasPermission(member.role as any, 'product:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to update products' },
        { status: 403 }
      );
    }

    // Verify product belongs to workspace
    const productCheck = await query(
      `SELECT id FROM products WHERE id = $1 AND workspace_id = $2`,
      [id, ws.id]
    );
    if (!productCheck.rows[0]) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'sku', 'description', 'categoryId', 'unit', 'minStock',
      'maxStock', 'costPrice', 'sellingPrice', 'barcode', 'imageUrl', 'isActive'
    ];

    const fieldMap: Record<string, string> = {
      categoryId: 'category_id',
      minStock: 'min_stock',
      maxStock: 'max_stock',
      costPrice: 'cost_price',
      sellingPrice: 'selling_price',
      imageUrl: 'image_url',
      isActive: 'is_active',
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const dbField = fieldMap[field] || field;
        updates.push(`${dbField} = $${paramIndex++}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, sku, name, updated_at`,
      values
    );

    return NextResponse.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/[workspace]/products/[id] - Delete product
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

    // Check membership and permissions
    const memberResult = await query(
      `SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2`,
      [session.user.id, ws.id]
    );
    const member = memberResult.rows[0];

    if (!member || !hasPermission(member.role as any, 'product:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete products' },
        { status: 403 }
      );
    }

    // Verify product belongs to workspace
    const productCheck = await query(
      `SELECT id FROM products WHERE id = $1 AND workspace_id = $2`,
      [id, ws.id]
    );
    if (!productCheck.rows[0]) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product has inventory
    const inventoryCheck = await query(
      `SELECT SUM(quantity) as total FROM inventory WHERE product_id = $1`,
      [id]
    );
    const totalStock = parseInt(inventoryCheck.rows[0]?.total || '0');

    if (totalStock > 0) {
      // Soft delete if has stock
      await query(
        `UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [id]
      );
      return NextResponse.json({
        message: 'Product deactivated (has inventory)',
        softDelete: true,
      });
    }

    // Hard delete if no stock
    await query(`DELETE FROM products WHERE id = $1`, [id]);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
