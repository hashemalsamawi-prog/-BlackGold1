import fs from 'fs';
import { CLOUDFLARE_CONFIG } from '../d1';

async function applySchemaToRemoteD1() {
  console.log('Connecting to Cloudflare D1 Remote Database:', CLOUDFLARE_CONFIG.databaseId);
  if (!CLOUDFLARE_CONFIG.accountId || !CLOUDFLARE_CONFIG.apiToken || !CLOUDFLARE_CONFIG.databaseId) {
    throw new Error('Missing Cloudflare D1 credentials.');
  }

  const schemaSql = fs.readFileSync('./server/d1_schema.sql', 'utf-8');
  
  // Split statements cleanly, ignoring comments and empty lines
  const rawStatements = schemaSql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${rawStatements.length} SQL statements to apply...`);

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;

  // We can execute them in batches or statement by statement to pinpoint any issues
  let successCount = 0;
  for (let i = 0; i < rawStatements.length; i++) {
    const stmt = rawStatements[i];
    // Clean comments from statement
    const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
    if (!cleanStmt) continue;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: cleanStmt
        })
      });

      const resJson: any = await response.json();
      if (!resJson.success) {
        console.warn(`Warning on statement ${i + 1}:`, resJson.errors?.[0]?.message || 'Unknown error');
      } else {
        successCount++;
      }
    } catch (err: any) {
      console.error(`Error executing statement ${i + 1}:`, err.message);
    }
  }

  const triggers = [
    `CREATE TRIGGER IF NOT EXISTS prevent_negative_stock
BEFORE UPDATE ON products
FOR EACH ROW
WHEN NEW.stock < 0
BEGIN
    SELECT RAISE(ABORT, 'Insufficient stock: product stock cannot be negative');
END;`,
    `CREATE TRIGGER IF NOT EXISTS prevent_negative_inventory_stock
BEFORE UPDATE ON inventory
FOR EACH ROW
WHEN NEW.current_stock < 0
BEGIN
    SELECT RAISE(ABORT, 'Insufficient stock: inventory current_stock cannot be negative');
END;`,
    `CREATE TRIGGER IF NOT EXISTS prevent_coupon_overuse
BEFORE UPDATE ON coupons
FOR EACH ROW
WHEN NEW.max_uses IS NOT NULL AND NEW.usage_count > NEW.max_uses
BEGIN
    SELECT RAISE(ABORT, 'Coupon usage limit exceeded');
END;`
  ];

  for (const triggerSql of triggers) {
    console.log('Applying trigger...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: triggerSql })
    });
    const resJson: any = await response.json();
    console.log('Trigger result:', JSON.stringify(resJson));
  }
}

applySchemaToRemoteD1().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
