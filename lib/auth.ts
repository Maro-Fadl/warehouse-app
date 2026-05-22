import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { query } from './db';

// Support flexible URLs for GitHub Codespaces, Ngrok, etc.
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return `http://localhost:${process.env.PORT || 3000}`;
};

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
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

        try {
          const result = await query(
            'SELECT id, email, name, avatar, password_hash FROM users WHERE email = $1',
            [credentials.email as string]
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

          // Update last login
          await query(
            'UPDATE users SET updated_at = NOW() WHERE id = $1',
            [user.id]
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };
        } catch (error: any) {
          console.error('Auth error:', error.message);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // Fetch user's workspaces on sign in or when session is updated
      if (trigger === 'signIn' || trigger === 'update' || !token.workspaces) {
        try {
          const result = await query(
            `SELECT w.id, w.name, w.slug, w.logo, w.plan_tier, w.subscription_status, wm.role
             FROM workspaces w
             JOIN workspace_members wm ON w.id = wm.workspace_id
             WHERE wm.user_id = $1
             ORDER BY wm.joined_at ASC`,
            [token.id as string]
          );
          token.workspaces = result.rows;
        } catch (error) {
          console.error('Error fetching workspaces:', error);
          token.workspaces = [];
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session as any).workspaces = token.workspaces || [];
      }
      return session;
    },
    async authorized({ auth, request }) {
      // Allow public paths
      const publicPaths = ['/login', '/signup', '/pricing', '/about', '/api/auth', '/api/webhooks'];
      const pathname = request.nextUrl?.pathname || '';

      if (publicPaths.some(path => pathname.startsWith(path))) {
        return true;
      }

      return !!auth;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/signup',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
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
       VALUES ($1, $2, 'retail', 'active', NOW() + INTERVAL '30 days')
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

    // Get retail plan and create subscription
    const planResult = await client.query(
      `SELECT id FROM subscription_plans WHERE tier = 'retail'`
    );
    if (planResult.rows[0]) {
      await client.query(
        `INSERT INTO subscriptions (workspace_id, plan_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days')`,
        [workspace.id, planResult.rows[0].id]
      );
    }

    return workspace;
  });
}
