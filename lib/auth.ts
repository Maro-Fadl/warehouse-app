import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { query } from './db';

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const result = await query(
          'SELECT id, email, name, avatar, password_hash FROM users WHERE email = $1',
          [credentials.email]
        );

        const user = result.rows[0];
        if (!user) {
          throw new Error('No account found with this email');
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch user's workspaces on sign in
      if (trigger === 'signIn' || !token.workspaces) {
        const result = await query(
          `SELECT w.id, w.name, w.slug, w.logo, w.plan_tier, wm.role
           FROM workspaces w
           JOIN workspace_members wm ON w.id = wm.workspace_id
           WHERE wm.user_id = $1
           ORDER BY wm.joined_at ASC`,
          [token.id]
        );
        token.workspaces = result.rows;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.workspaces = token.workspaces as any[];
      }
      return session;
    },
    async authorized({ auth, request }) {
      return !!auth;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

/**
 * Get the current user's workspace membership and role.
 */
export async function getWorkspaceMembership(userId: string, workspaceId: string) {
  const result = await query(
    `SELECT role, permissions FROM workspace_members
     WHERE user_id = $1 AND workspace_id = $2`,
    [userId, workspaceId]
  );
  return result.rows[0] || null;
}

/**
 * Get all workspaces for a user.
 */
export async function getUserWorkspaces(userId: string) {
  const result = await query(
    `SELECT w.id, w.name, w.slug, w.logo, w.plan_tier, w.subscription_status, wm.role
     FROM workspaces w
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = $1
     ORDER BY wm.joined_at ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Create a new workspace and add the user as owner.
 */
export async function createWorkspace(userId: string, name: string, slug: string) {
  const { transaction } = await import('./db');

  return transaction(async (client) => {
    // Create workspace
    const wsResult = await client.query(
      `INSERT INTO workspaces (name, slug, plan_tier, subscription_status, trial_ends_at)
       VALUES ($1, $2, 'personal', 'trialing', NOW() + INTERVAL '14 days')
       RETURNING id, name, slug`,
      [name, slug]
    );
    const workspace = wsResult.rows[0];

    // Add user as owner
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [workspace.id, userId]
    );

    return workspace;
  });
}
