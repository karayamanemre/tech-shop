import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { db } from '../backend/db.js';
import { schema } from '../backend/schema.js';
const sql = db();
for (const statement of schema) await sql.query(statement);
const catalog = JSON.parse(
  await readFile(
    new URL('../backend/data/catalog.json', import.meta.url),
    'utf8'
  )
);
await sql.transaction(
  catalog.map(
    (p) =>
      sql`INSERT INTO shop_products(id,data,stock) VALUES(${p._id},${JSON.stringify(p)}::jsonb,${p.countInStock}) ON CONFLICT(id) DO NOTHING`
  )
);
const localization = JSON.parse(
  await readFile(
    new URL('../backend/data/localization.json', import.meta.url),
    'utf8'
  )
);
await sql.transaction(
  localization.map(
    (p) =>
      sql`UPDATE shop_products SET data=data || jsonb_build_object('category',CASE WHEN data->>'category'=${p.previousCategory} THEN ${p.category} ELSE data->>'category' END,'description',CASE WHEN data->>'description'=${p.previousDescription} THEN ${p.description} ELSE data->>'description' END) WHERE id=${p.id}`
  )
);
// Translate only the named fictional QA content generated during deployment verification.
await sql`UPDATE shop_users SET name=CASE name WHEN 'Demo Doğrulama' THEN 'Demo Verification' WHEN 'Demo Doğrulama Güncel' THEN 'Demo Verification Updated' WHEN 'Demo İkinci Hesap' THEN 'Demo Second Account' ELSE name END WHERE email LIKE 'qa-%@techshop.demo'`;
await sql`UPDATE shop_reviews SET comment='Live verification: the demo checkout flow was completed.' WHERE comment='Canlı doğrulama: demo alışveriş akışı tamamlandı.' AND user_id IN(SELECT id FROM shop_users WHERE email LIKE 'qa-%@techshop.demo')`;
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await sql`INSERT INTO shop_users(name,email,password_hash,is_admin) VALUES('Emre Karayaman',${process.env.ADMIN_EMAIL.toLowerCase()},${hash},true) ON CONFLICT(email) DO NOTHING`;
}
await sql`DELETE FROM shop_sessions WHERE expires_at < now()`;
await sql`DELETE FROM shop_limits WHERE expires_at < now()`;
console.log(
  `Database ready: ${catalog.length} catalog products (existing data preserved).`
);
