import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserWorkspaces, createWorkspace } from '@/lib/auth';
import { workspaceSchema } from '@/lib/validators';

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await getUserWorkspaces(session.user.id);
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = workspaceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check slug uniqueness
    const { query } = await import('@/lib/db');
    const existingResult = await query(
      `SELECT id FROM workspaces WHERE slug = $1`,
      [data.slug]
    );
    if (existingResult.rows[0]) {
      return NextResponse.json(
        { error: 'Workspace slug already taken' },
        { status: 409 }
      );
    }

    // Create workspace
    const workspace = await createWorkspace(session.user.id, data.name, data.slug);

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
