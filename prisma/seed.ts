import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/warehouse_pro',
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create subscription plans
    await client.query(`
      INSERT INTO subscription_plans (id, name, tier, price_monthly, price_yearly, max_warehouses, max_users, max_products, max_pos_terminals, max_ai_queries, features, is_active)
      VALUES
        (gen_random_uuid(), 'Personal', 'personal', 9, 90, 1, 1, 100, 0, 10, '{"advancedAnalytics":false,"apiAccess":false,"prioritySupport":false}', true),
        (gen_random_uuid(), 'Retail / POS', 'retail', 29, 290, 5, 10, 5000, 3, 100, '{"advancedAnalytics":true,"apiAccess":false,"prioritySupport":true}', true),
        (gen_random_uuid(), 'Enterprise', 'enterprise', 99, 990, 999999, 999999, 999999, 999999, 999999, '{"advancedAnalytics":true,"apiAccess":true,"prioritySupport":true}', true)
      ON CONFLICT (tier) DO NOTHING
    `);

    // Hash passwords
    const passwordHash = await bcrypt.hash('password123', 12);
    const adminHash = await bcrypt.hash('admin123', 12);

    // Create demo users
    const usersResult = await client.query(`
      INSERT INTO users (id, email, name, password_hash, locale, theme_preference)
      VALUES
        (gen_random_uuid(), 'john@warehousepro.com', 'John Doe', $1, 'en', 'system'),
        (gen_random_uuid(), 'sarah@warehousepro.com', 'Sarah Manager', $1, 'en', 'light'),
        (gen_random_uuid(), 'ahmed@warehousepro.com', 'Ahmed Ali', $1, 'ar', 'dark'),
        (gen_random_uuid(), 'admin@warehousepro.com', 'Admin User', $2, 'en', 'dark')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `, [passwordHash, adminHash]);

    const users = usersResult.rows;
    if (users.length === 0) {
      console.log('Users already exist, skipping seed');
      await client.query('COMMIT');
      return;
    }

    const johnId = users.find(u => u.email === 'john@warehousepro.com')?.id;
    const sarahId = users.find(u => u.email === 'sarah@warehousepro.com')?.id;
    const ahmedId = users.find(u => u.email === 'ahmed@warehousepro.com')?.id;

    // Get retail plan
    const planResult = await client.query(`SELECT id FROM subscription_plans WHERE tier = 'retail'`);
    const retailPlanId = planResult.rows[0]?.id;

    // Create workspaces
    const wsResult = await client.query(`
      INSERT INTO workspaces (id, name, slug, plan_tier, subscription_status, trial_ends_at)
      VALUES
        (gen_random_uuid(), 'Acme Logistics', 'acme-logistics', 'retail', 'active', NOW() + INTERVAL '14 days'),
        (gen_random_uuid(), 'Arabic Trading Co', 'arabic-trading', 'retail', 'active', NOW() + INTERVAL '14 days')
      RETURNING id, slug
    `);

    const acmeWs = wsResult.rows.find(w => w.slug === 'acme-logistics');
    const arabicWs = wsResult.rows.find(w => w.slug === 'arabic-trading');

    if (!acmeWs || !arabicWs) throw new Error('Failed to create workspaces');

    // Add members
    await client.query(`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES
        ($1, $4, 'owner'),
        ($1, $5, 'manager'),
        ($2, $6, 'owner')
    `, [acmeWs.id, arabicWs.id, null, johnId, sarahId, ahmedId]);

    // Create subscriptions
    if (retailPlanId) {
      await client.query(`
        INSERT INTO subscriptions (workspace_id, plan_id, status, current_period_start, current_period_end)
        VALUES
          ($1, $3, 'active', NOW(), NOW() + INTERVAL '30 days'),
          ($2, $3, 'active', NOW(), NOW() + INTERVAL '30 days')
      `, [acmeWs.id, arabicWs.id, retailPlanId]);
    }

    // Create warehouses for Acme
    const whResult = await client.query(`
      INSERT INTO warehouses (id, workspace_id, name, address, city, country, lat, lng)
      VALUES
        (gen_random_uuid(), $1, 'Main Warehouse', '123 Industrial Blvd', 'New York', 'US', 40.7128, -74.0060),
        (gen_random_uuid(), $1, 'Distribution Center', '456 Logistics Ave', 'Los Angeles', 'US', 34.0522, -118.2437),
        (gen_random_uuid(), $1, 'Cold Storage', '789 Refrigeration St', 'Chicago', 'US', 41.8781, -87.6298)
      RETURNING id, name
    `, [acmeWs.id]);

    const mainWh = whResult.rows[0];

    // Create categories
    const catResult = await client.query(`
      INSERT INTO product_categories (id, workspace_id, name, icon, color)
      VALUES
        (gen_random_uuid(), $1, 'Electronics', 'cpu', '#3B82F6'),
        (gen_random_uuid(), $1, 'Clothing', 'shirt', '#10B981'),
        (gen_random_uuid(), $1, 'Food & Beverages', 'coffee', '#F59E0B'),
        (gen_random_uuid(), $1, 'Hardware', 'wrench', '#6366F1')
      RETURNING id, name
    `, [acmeWs.id]);

    // Create products
    await client.query(`
      INSERT INTO products (id, workspace_id, sku, name, description, category_id, unit, min_stock, max_stock, cost_price, selling_price, barcode)
      VALUES
        (gen_random_uuid(), $1, 'SKU001', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', (SELECT id FROM product_categories WHERE name='Electronics' AND workspace_id=$1), 'pcs', 20, 500, 15.00, 29.99, '1234567890123'),
        (gen_random_uuid(), $1, 'SKU002', 'USB-C Cable', 'Premium braided USB-C cable 6ft', (SELECT id FROM product_categories WHERE name='Electronics' AND workspace_id=$1), 'pcs', 50, 1000, 5.00, 12.99, '1234567890124'),
        (gen_random_uuid(), $1, 'SKU003', 'Cotton T-Shirt', 'Premium cotton crew neck t-shirt', (SELECT id FROM product_categories WHERE name='Clothing' AND workspace_id=$1), 'pcs', 30, 200, 8.00, 24.99, '1234567890125'),
        (gen_random_uuid(), $1, 'SKU004', 'Organic Coffee Beans', '1kg bag of premium organic coffee', (SELECT id FROM product_categories WHERE name='Food & Beverages' AND workspace_id=$1), 'kg', 10, 100, 12.00, 22.99, '1234567890126'),
        (gen_random_uuid(), $1, 'SKU005', 'Power Drill', 'Cordless power drill with battery pack', (SELECT id FROM product_categories WHERE name='Hardware' AND workspace_id=$1), 'pcs', 5, 50, 45.00, 89.99, '1234567890127'),
        (gen_random_uuid(), $1, 'SKU006', 'LED Light Bulb', 'Energy efficient LED bulb 10W', (SELECT id FROM product_categories WHERE name='Electronics' AND workspace_id=$1), 'pcs', 100, 2000, 2.50, 6.99, '1234567890128'),
        (gen_random_uuid(), $1, 'SKU007', 'Winter Jacket', 'Waterproof winter jacket', (SELECT id FROM product_categories WHERE name='Clothing' AND workspace_id=$1), 'pcs', 10, 100, 35.00, 79.99, '1234567890129'),
        (gen_random_uuid(), $1, 'SKU008', 'Green Tea', 'Premium Japanese green tea 500g', (SELECT id FROM product_categories WHERE name='Food & Beverages' AND workspace_id=$1), 'pcs', 20, 150, 8.00, 16.99, '1234567890130')
    `, [acmeWs.id]);

    // Create inventory
    await client.query(`
      INSERT INTO inventory (warehouse_id, product_id, quantity, reserved_quantity, shelf_location)
      SELECT $1, id,
        CASE
          WHEN sku = 'SKU001' THEN 150
          WHEN sku = 'SKU002' THEN 300
          WHEN sku = 'SKU003' THEN 80
          WHEN sku = 'SKU004' THEN 25
          WHEN sku = 'SKU005' THEN 3
          WHEN sku = 'SKU006' THEN 500
          WHEN sku = 'SKU007' THEN 50
          WHEN sku = 'SKU008' THEN 60
        END,
        CASE WHEN sku = 'SKU001' THEN 10 ELSE 0 END,
        CASE
          WHEN sku LIKE 'SKU00[1-2]' THEN 'A-1-1'
          WHEN sku LIKE 'SKU00[3-4]' THEN 'B-2-1'
          WHEN sku LIKE 'SKU00[5-6]' THEN 'C-3-1'
          ELSE 'D-4-1'
        END
      FROM products WHERE workspace_id = $2
    `, [mainWh.id, acmeWs.id]);

    // Create customers
    await client.query(`
      INSERT INTO customers (workspace_id, name, email, phone, loyalty_points)
      VALUES
        ($1, 'Walk-in Customer', 'walkin@store.com', '+1234567890', 0),
        ($1, 'Premium Buyer', 'premium@email.com', '+1234567891', 500),
        ($1, 'Bulk Orders Inc', 'bulk@company.com', '+1234567892', 1200)
    `, [acmeWs.id]);

    // Create some POS transactions
    const txnResult = await client.query(`
      INSERT INTO pos_transactions (warehouse_id, cashier_id, subtotal, tax, discount, total, payment_method, status)
      VALUES ($1, $2, 250.00, 25.00, 0, 275.00, 'card', 'completed')
      RETURNING id
    `, [mainWh.id, johnId]);

    // Create notifications
    await client.query(`
      INSERT INTO notifications (workspace_id, user_id, type, title, message, data)
      VALUES
        ($1, $2, 'low_stock', 'Low Stock Alert', 'Power Drill (SKU005) is below minimum stock level', '{"productId":"SKU005","current":3,"minimum":5}'),
        ($1, $2, 'system', 'Welcome!', 'Welcome to WareHouse Pro. Start by adding your products and warehouses.', '{}')
    `, [acmeWs.id, johnId]);

    await client.query('COMMIT');
    console.log('Seed completed successfully!');
    console.log('\nDemo accounts:');
    console.log('  john@warehousepro.com / password123 (Owner - Acme Logistics)');
    console.log('  sarah@warehousepro.com / password123 (Manager - Acme Logistics)');
    console.log('  ahmed@warehousepro.com / password123 (Owner - Arabic Trading Co)');
    console.log('  admin@warehousepro.com / admin123 (Admin)');

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
