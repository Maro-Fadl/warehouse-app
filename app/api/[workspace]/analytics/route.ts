import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';
import { getWorkspaceAnalytics, getDailyRevenue } from '@/lib/analytics';

// GET /api/[workspace]/analytics
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
    const period = (searchParams.get('period') || 'month') as 'today' | 'week' | 'month';
    const days = parseInt(searchParams.get('days') || '30');

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

    if (!member || !hasPermission(member.role as any, 'analytics:view')) {
      return NextResponse.json(
        { error: 'You do not have permission to view analytics' },
        { status: 403 }
      );
    }

    const [analytics, dailyRevenue] = await Promise.all([
      getWorkspaceAnalytics(workspaceId, period),
      getDailyRevenue(workspaceId, days),
    ]);

    return NextResponse.json({
      analytics,
      dailyRevenue,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
