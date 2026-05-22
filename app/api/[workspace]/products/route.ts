import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { productSchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';
import { canAddResource } from '@/lib/subscriptions';

// GET /api/[workspace]/products
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
    const limit = parseInt(searchParams.get('limit') || '20');
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

    // Build query
    let whereClause = 'WHERE p.workspace_id = $1';
    const queryParams: any[] = [workspaceId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
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
        pc.name as category_name,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COALESCE(SUM(i.reserved_quantity), 0) as total_reserved
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       LEFT JOIN inventory i ON p.id = i.product_id
       ${whereClause}
       GROUP BY p.id, pc.name
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

    return NextResponse.json({
      products: productsResult.rows,
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

// POST /api/[workspace]/products
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
       RETURNING id, sku, name`,
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
