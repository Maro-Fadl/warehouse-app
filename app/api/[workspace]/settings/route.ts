import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

// GET /api/[workspace]/settings - Get workspace settings
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
      `SELECT id, name, slug, settings, plan_tier, subscription_status FROM workspaces WHERE slug = $1`,
      [workspace]
    );
    const ws = wsResult.rows[0];

    if (!ws) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership
    const memberResult = await query(
      `SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2`,
      [session.user.id, ws.id]
    );
    if (!memberResult.rows[0]) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      workspace: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        settings: ws.settings,
        planTier: ws.plan_tier,
        subscriptionStatus: ws.subscription_status,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/[workspace]/settings - Update workspace settings
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

    if (!member || !hasPermission(member.role as any, 'settings:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to update settings' },
        { status: 403 }
      );
    }

    // Update workspace name if provided
    if (body.name) {
      await query(
        `UPDATE workspaces SET name = $1, updated_at = NOW() WHERE id = $2`,
        [body.name, ws.id]
      );
    }

    // Update settings JSON
    if (body.settings) {
      await query(
        `UPDATE workspaces SET settings = settings || $1::jsonb, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(body.settings), ws.id]
      );
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
