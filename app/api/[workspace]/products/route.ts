import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { productSchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';
import { canAddResource } from '@/lib/subscriptions';

// GET /api/[workspace]/products - List products
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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get workspace by slug
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

    // Build query with filters
    let whereClause = 'WHERE p.workspace_id = $1 AND p.is_active = true';
    const queryParams: any[] = [workspaceId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.barcode = $${paramIndex + 1})`;
      queryParams.push(`%${search}%`, search);
      paramIndex += 2;
    }

    if (category) {
      whereClause += ` AND pc.name = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    const productsResult = await query(
      `SELECT
        p.id, p.sku, p.name, p.description, p.unit, p.min_stock, p.max_stock,
        p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active,
        p.created_at, p.updated_at,
        pc.name as category_name, pc.id as category_id,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COALESCE(SUM(i.reserved_quantity), 0) as total_reserved
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       LEFT JOIN inventory i ON p.id = i.product_id
       ${whereClause}
       GROUP BY p.id, pc.name, pc.id
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       ${whereClause}`,
      queryParams
    );

    // Get categories for filter
    const categoriesResult = await query(
      `SELECT id, name FROM product_categories WHERE workspace_id = $1 ORDER BY name`,
      [workspaceId]
    );

    return NextResponse.json({
      products: productsResult.rows,
      categories: categoriesResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/[workspace]/products - Create product
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
    const validation = productSchema.safeParse(body);
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

    if (!member || !hasPermission(member.role as any, 'product:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to create products' },
        { status: 403 }
      );
    }

    // Check product limit
    const countResult = await query(
      `SELECT COUNT(*) FROM products WHERE workspace_id = $1`,
      [ws.id]
    );
    const productCount = parseInt(countResult.rows[0].count);

    if (!canAddResource(ws.plan_tier as any, 'products', productCount)) {
      return NextResponse.json(
        { error: 'Product limit reached for your plan. Please upgrade.' },
        { status: 403 }
      );
    }

    // Check SKU uniqueness
    const skuCheck = await query(
      `SELECT id FROM products WHERE workspace_id = $1 AND sku = $2`,
      [ws.id, data.sku]
    );
    if (skuCheck.rows[0]) {
      return NextResponse.json(
        { error: 'SKU already exists in this workspace' },
        { status: 409 }
      );
    }

    // Create product
    const result = await query(
      `INSERT INTO products (workspace_id, sku, name, description, category_id, unit, min_stock, max_stock, cost_price, selling_price, barcode, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, sku, name, created_at`,
      [
        ws.id,
        data.sku,
        data.name,
        data.description || null,
        data.categoryId || null,
        data.unit,
        data.minStock,
        data.maxStock || null,
        data.costPrice,
        data.sellingPrice,
        data.barcode || null,
        data.imageUrl || null,
      ]
    );

    return NextResponse.json({ product: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/[workspace]/products - Update product (bulk or single)
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
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
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

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }
    if (updateData.sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(updateData.sku);
    }
    if (updateData.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }
    if (updateData.categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(updateData.categoryId);
    }
    if (updateData.unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(updateData.unit);
    }
    if (updateData.minStock !== undefined) {
      updates.push(`min_stock = $${paramIndex++}`);
      values.push(updateData.minStock);
    }
    if (updateData.maxStock !== undefined) {
      updates.push(`max_stock = $${paramIndex++}`);
      values.push(updateData.maxStock);
    }
    if (updateData.costPrice !== undefined) {
      updates.push(`cost_price = $${paramIndex++}`);
      values.push(updateData.costPrice);
    }
    if (updateData.sellingPrice !== undefined) {
      updates.push(`selling_price = $${paramIndex++}`);
      values.push(updateData.sellingPrice);
    }
    if (updateData.barcode !== undefined) {
      updates.push(`barcode = $${paramIndex++}`);
      values.push(updateData.barcode);
    }
    if (updateData.imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(updateData.imageUrl);
    }
    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(updateData.isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, sku, name, updated_at`,
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

// DELETE /api/[workspace]/products - Soft delete product
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
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
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

    if (!member || !hasPermission(member.role as any, 'product:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete products' },
        { status: 403 }
      );
    }

    // Verify product belongs to workspace
    const productCheck = await query(
      `SELECT id FROM products WHERE id = $1 AND workspace_id = $2`,
      [productId, ws.id]
    );
    if (!productCheck.rows[0]) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete (set is_active to false)
    await query(
      `UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [productId]
    );

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
