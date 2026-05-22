import { query } from './db';

export type NotificationType = 'low_stock' | 'expiry' | 'system' | 'order';

interface CreateNotificationParams {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Create a new notification.
 */
export async function createNotification(params: CreateNotificationParams) {
  await query(
    `INSERT INTO notifications (workspace_id, user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.workspaceId,
      params.userId,
      params.type,
      params.title,
      params.message,
      JSON.stringify(params.data || {}),
    ]
  );
}

/**
 * Create notifications for all workspace members.
 */
export async function notifyWorkspace(
  workspaceId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  const membersResult = await query(
    `SELECT user_id FROM workspace_members WHERE workspace_id = $1`,
    [workspaceId]
  );

  for (const member of membersResult.rows) {
    await createNotification({
      workspaceId,
      userId: member.user_id,
      type,
      title,
      message,
      data,
    });
  }
}

/**
 * Check for low stock items and create notifications.
 */
export async function checkLowStock(workspaceId: string) {
  const lowStockResult = await query(
    `SELECT p.id, p.name, p.sku, p.min_stock, i.quantity, w.name as warehouse_name, w.id as warehouse_id
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     JOIN warehouses w ON i.warehouse_id = w.id
     WHERE p.workspace_id = $1 AND i.quantity <= p.min_stock AND p.is_active = true`,
    [workspaceId]
  );

  for (const item of lowStockResult.rows) {
    // Check if notification already exists for this item today
    const existingResult = await query(
      `SELECT id FROM notifications
       WHERE workspace_id = $1
       AND type = 'low_stock'
       AND data->>'productId' = $2
       AND created_at >= CURRENT_DATE`,
      [workspaceId, item.id]
    );

    if (existingResult.rows.length === 0) {
      await notifyWorkspace(
        workspaceId,
        'low_stock',
        'Low Stock Alert',
        `${item.name} (${item.sku}) is below minimum stock level at ${item.warehouse_name}. Current: ${item.quantity}, Minimum: ${item.min_stock}`,
        {
          productId: item.id,
          sku: item.sku,
          warehouseId: item.warehouse_id,
          current: item.quantity,
          minimum: item.min_stock,
        }
      );
    }
  }
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
  await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
    [notificationId, userId]
  );
}

/**
 * Mark all notifications as read for a user in a workspace.
 */
export async function markAllAsRead(workspaceId: string, userId: string) {
  await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE workspace_id = $1 AND user_id = $2 AND read_at IS NULL`,
    [workspaceId, userId]
  );
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount(workspaceId: string, userId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) FROM notifications
     WHERE workspace_id = $1 AND user_id = $2 AND read_at IS NULL`,
    [workspaceId, userId]
  );
  return parseInt(result.rows[0].count);
}
