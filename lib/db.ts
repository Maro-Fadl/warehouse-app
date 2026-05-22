import { Pool, PoolClient, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a query with optional workspace isolation.
 * When workspaceId is provided, sets the RLS context for the transaction.
 */
export async function query<T = any>(
  text: string,
  params?: any[],
  workspaceId?: string
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    if (workspaceId) {
      await client.query(`SET app.current_workspace_id = '${workspaceId}'`);
    }
    return await client.query<T>(text, params);
  } finally {
    if (workspaceId) {
      await client.query('RESET app.current_workspace_id');
    }
    client.release();
  }
}

/**
 * Execute multiple queries in a transaction with workspace isolation.
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  workspaceId?: string
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (workspaceId) {
      await client.query(`SET app.current_workspace_id = '${workspaceId}'`);
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    if (workspaceId) {
      await client.query('RESET app.current_workspace_id').catch(() => {});
    }
    client.release();
  }
}

/**
 * Get a client with workspace context set for RLS.
 */
export async function getWorkspaceClient(workspaceId: string): Promise<PoolClient> {
  const client = await pool.connect();
  await client.query(`SET app.current_workspace_id = '${workspaceId}'`);
  return client;
}

/**
 * Release a client and reset workspace context.
 */
export async function releaseClient(client: PoolClient, workspaceId?: string): Promise<void> {
  if (workspaceId) {
    await client.query('RESET app.current_workspace_id').catch(() => {});
  }
  client.release();
}

export default pool;
