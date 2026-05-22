import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { aiQuerySchema } from '@/lib/validators';
import { hasPermission } from '@/lib/rbac';
import { canUseAi } from '@/lib/subscriptions';
import { processAIQuery, getOrCreateConversation, saveMessage, getSuggestedQueries } from '@/lib/ai';

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
    const conversationId = await getOrCreateConversation(
      ws.id,
      session.user.id,
      data.conversationId
    );

    // Save user message
    await saveMessage(conversationId, 'user', data.query);

    // Process query
    const result = await processAIQuery(data.query, {
      workspaceId: ws.id,
      userId: session.user.id,
    });

    // Save assistant response
    await saveMessage(conversationId, 'assistant', result.response, result.data);

    return NextResponse.json({
      response: result.response,
      conversationId,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error processing AI query:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const suggestions = await getSuggestedQueries(workspaceId);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
