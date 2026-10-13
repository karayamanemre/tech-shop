import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { db } from '../backend/db.js';
import { schema } from '../backend/schema.js';
const sql=db();
for (const statement of schema) await sql.query(statement);
const catalog=JSON.parse(await readFile(new URL('../backend/data/catalog.json',import.meta.url),'utf8'));
await sql.transaction(catalog.map(p=>sql`INSERT INTO shop_products(id,data,stock) VALUES(${p._id},${JSON.stringify(p)}::jsonb,${p.countInStock}) ON CONFLICT(id) DO NOTHING`));
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
 const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);
 await sql`INSERT INTO shop_users(name,email,password_hash,is_admin) VALUES('Emre Karayaman',${process.env.ADMIN_EMAIL.toLowerCase()},${hash},true) ON CONFLICT(email) DO NOTHING`;
}
await sql`DELETE FROM shop_sessions WHERE expires_at < now()`;
await sql`DELETE FROM shop_limits WHERE expires_at < now()`;
console.log(`Database ready: ${catalog.length} catalog products (existing data preserved).`);
