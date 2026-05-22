import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { warehouseSchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';
import { canAddResource } from '@/lib/subscriptions';

// GET /api/[workspace]/warehouses
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
        COUNT(DISTINCT i.product_id) as product_count,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COUNT(DISTINCT wm2.user_id) as member_count
       FROM warehouses w
       LEFT JOIN inventory i ON w.id = i.warehouse_id
       LEFT JOIN workspace_members wm2 ON w.workspace_id = wm2.workspace_id
       WHERE w.workspace_id = $1
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

// POST /api/[workspace]/warehouses
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
      `SELECT COUNT(*) FROM warehouses WHERE workspace_id = $1`,
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
       RETURNING id, name, address, city, country`,
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
