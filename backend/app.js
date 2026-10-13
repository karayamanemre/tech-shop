import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { z } from 'zod';
import { db } from './db.js';
import { credentials, registration, checkoutSchema, idSchema, canReadOrder, publicUser } from './validation.js';
const app=express();
app.disable('x-powered-by');
app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'100kb'}));
app.use(cookieParser());
app.use('/api', (req,res,next)=>{
 res.setHeader('Cache-Control','no-store');
 if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin) {
  try {const origin=new URL(req.headers.origin); if(origin.host!==req.get('host')) return res.status(403).json({message:'İstek kaynağı doğrulanamadı.'});} catch {return res.status(403).json({message:'Geçersiz kaynak.'});}
 }
 next();
});
const hash=s=>createHash('sha256').update(s).digest('hex');
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400000};
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const wrap=fn=>async(req,res,next)=>{try{await fn(req,res,next);}catch(e){next(e);}};
const limit=(area,max=30)=>wrap(async(req,res,next)=>{
 const key=hash(`${area}:${req.ip}:${Math.floor(Date.now()/600000)}`);
 const sql=db();const [row]=await sql`INSERT INTO shop_limits(key,count,expires_at) VALUES(${key},1,now()+interval '10 minutes') ON CONFLICT(key) DO UPDATE SET count=shop_limits.count+1 RETURNING count`;
 if(row.count>max){res.setHeader('Retry-After','600');fail(429,'Çok fazla istek. Birkaç dakika sonra tekrar dene.');}next();
});
const protect=wrap(async(req,res,next)=>{if(!req.cookies.session)fail(401,'Devam etmek için giriş yap.');const sql=db();const [u]=await sql`SELECT u.* FROM shop_sessions s JOIN shop_users u ON u.id=s.user_id WHERE s.token_hash=${hash(req.cookies.session)} AND s.expires_at>now()`;if(!u)fail(401,'Oturumun sona erdi. Tekrar giriş yap.');req.user=publicUser(u);next();});
const admin=(req,res,next)=>req.user?.isAdmin?next():res.status(403).json({message:'Yönetici erişimi gerekiyor.'});
async function session(res,u){const token=randomBytes(32).toString('base64url');const sql=db();await sql`INSERT INTO shop_sessions(token_hash,user_id,expires_at) VALUES(${hash(token)},${u.id},now()+interval '7 days')`;res.cookie('session',token,cookieOptions);return publicUser(u);}
const productSchema=z.object({name:z.string().trim().min(2).max(140),description:z.string().trim().min(5).max(4000),brand:z.string().trim().min(1).max(80),category:z.string().trim().min(1).max(80),price:z.coerce.number().min(0).max(100000),countInStock:z.coerce.number().int().min(0).max(500),image:z.string().max(1000).refine(s=>s.startsWith('/catalog/')||s.startsWith('/images/')||s.startsWith('/uploads/')||/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(s),'Geçerli bir ürün görseli seç.')});
async function readProduct(id){idSchema.parse(id);const sql=db();const [p]=await sql`SELECT * FROM shop_products WHERE id=${id}`;if(!p)fail(404,'Ürün bulunamadı.');const reviews=await sql`SELECT r.id AS "_id",r.user_id AS "user",u.name,r.rating,r.comment,r.created_at AS "createdAt" FROM shop_reviews r JOIN shop_users u ON u.id=r.user_id WHERE r.product_id=${id} ORDER BY r.created_at DESC`;return {...p.data,_id:p.id,countInStock:p.stock,reviews,rating:reviews.length?reviews.reduce((s,r)=>s+r.rating,0)/reviews.length:0,numReviews:reviews.length};}
app.get('/api/health',wrap(async(req,res)=>{const sql=db();await sql`SELECT 1`;res.json({status:'ok',database:'connected',mode:'portfolio-demo'});}));
app.get('/api/config', (req,res)=>res.json({demo:true,currency:'USD',shippingThreshold:500,shippingCost:10,taxRate:.15}));
app.get('/api/products/top',wrap(async(req,res)=>{const sql=db();const rows=await sql`SELECT id,data,stock FROM shop_products ORDER BY CASE WHEN data->>'category'='Ses' THEN 0 ELSE 1 END,created_at DESC LIMIT 4`;res.json(rows.map(p=>({...p.data,_id:p.id,countInStock:p.stock})));}));
app.get('/api/products',wrap(async(req,res)=>{
 const sql=db();const page=Math.max(1,Math.min(10000,Number(req.query.pageNumber)||1));const size=12;const keyword=String(req.query.keyword||'').slice(0,80);const category=String(req.query.category||'').slice(0,80);const sort=String(req.query.sort||'featured');
 const rows=await sql`SELECT p.id,p.data,p.stock,coalesce(avg(r.rating),0)::float AS rating,count(r.id)::int AS reviews FROM shop_products p LEFT JOIN shop_reviews r ON r.product_id=p.id WHERE (position(lower(${keyword}) in lower(p.data->>'name'))>0 OR position(lower(${keyword}) in lower(p.data->>'brand'))>0) AND (${category}='' OR p.data->>'category'=${category}) GROUP BY p.id ORDER BY (p.data->>'featuredRank')::int NULLS LAST,p.created_at DESC,p.id`;
 const products=rows.map(p=>({...p.data,_id:p.id,countInStock:p.stock,rating:p.rating,numReviews:p.reviews}));
 if(sort==='price-asc')products.sort((a,b)=>a.price-b.price);if(sort==='price-desc')products.sort((a,b)=>b.price-a.price);if(sort==='name')products.sort((a,b)=>a.name.localeCompare(b.name));
 const cats=await sql`SELECT DISTINCT data->>'category' AS name FROM shop_products ORDER BY name`;
 res.json({products:products.slice((page-1)*size,page*size),page,pages:Math.ceil(products.length/size),total:products.length,categories:cats.map(x=>x.name)});
}));
app.get('/api/products/:id',wrap(async(req,res)=>res.json(await readProduct(req.params.id))));
app.post('/api/products',protect,admin,wrap(async(req,res)=>{const sql=db();const id=randomUUID();const data={_id:id,name:'Yeni ürün',price:0,description:'Ürün açıklaması',image:'/images/sample.jpg',images:['/images/sample.jpg'],brand:'TechShop',category:'Aksesuar',rating:0,numReviews:0,reviews:[],createdAt:new Date().toISOString()};await sql`INSERT INTO shop_products(id,data,stock) VALUES(${id},${JSON.stringify(data)}::jsonb,0)`;res.status(201).json({...data,countInStock:0});}));
app.put('/api/products/:id',protect,admin,wrap(async(req,res)=>{const current=await readProduct(req.params.id);const data=productSchema.parse(req.body);const sql=db();const updated={...current,...data,images:current.image===data.image?current.images:[data.image]};await sql`UPDATE shop_products SET data=${JSON.stringify(updated)}::jsonb,stock=${data.countInStock} WHERE id=${current._id}`;res.json(updated);}));
app.delete('/api/products/:id',protect,admin,wrap(async(req,res)=>{idSchema.parse(req.params.id);const sql=db();const rows=await sql`DELETE FROM shop_products WHERE id=${req.params.id} RETURNING id`;if(!rows.length)fail(404,'Ürün bulunamadı.');res.json({message:'Ürün kaldırıldı.'});}));
app.post('/api/products/:id/reviews',protect,limit('review',20),wrap(async(req,res)=>{idSchema.parse(req.params.id);const body=z.object({rating:z.coerce.number().int().min(1).max(5),comment:z.string().trim().min(3).max(1000)}).parse(req.body);const sql=db();const bought=await sql`SELECT id FROM shop_orders WHERE user_id=${req.user._id} AND data->>'demoCompleted'='true' AND EXISTS(SELECT 1 FROM jsonb_array_elements(data->'orderItems') i WHERE i->>'product'=${req.params.id}) LIMIT 1`;if(!bought.length)fail(403,'Yorum yazmak için bu ürünün demo siparişini tamamlamalısın.');await sql`INSERT INTO shop_reviews(product_id,user_id,rating,comment) VALUES(${req.params.id},${req.user._id},${body.rating},${body.comment})`;res.status(201).json({message:'Yorum eklendi.'});}));
app.post('/api/users',limit('register',10),wrap(async(req,res)=>{const body=registration.parse(req.body);const sql=db();const pwd=await bcrypt.hash(body.password,12);const [u]=await sql`INSERT INTO shop_users(name,email,password_hash) VALUES(${body.name},${body.email},${pwd}) RETURNING *`;res.status(201).json(await session(res,u));}));
app.post('/api/users/login',limit('login',30),wrap(async(req,res)=>{const body=credentials.parse(req.body);const sql=db();const [u]=await sql`SELECT * FROM shop_users WHERE email=${body.email}`;if(!u||!await bcrypt.compare(body.password,u.password_hash))fail(401,'E-posta veya şifre hatalı.');res.json(await session(res,u));}));
app.post('/api/users/logout',wrap(async(req,res)=>{const sql=db();if(req.cookies.session)await sql`DELETE FROM shop_sessions WHERE token_hash=${hash(req.cookies.session)}`;res.clearCookie('session',{...cookieOptions,maxAge:undefined});res.json({message:'Çıkış yapıldı.'});}));
app.get('/api/users/profile',protect,(req,res)=>res.json(req.user));
app.put('/api/users/profile',protect,wrap(async(req,res)=>{const body=z.object({name:z.string().trim().min(2).max(80),email:z.email().max(254).transform(s=>s.toLowerCase()),password:z.string().min(10).max(72).optional(),currentPassword:z.string().max(72).optional()}).parse(req.body);const sql=db();const [u]=await sql`SELECT * FROM shop_users WHERE id=${req.user._id}`;if(body.email!==u.email||body.password){if(!body.currentPassword||!await bcrypt.compare(body.currentPassword,u.password_hash))fail(403,'E-posta veya şifre değiştirmek için mevcut şifreni gir.');}const pwd=body.password?await bcrypt.hash(body.password,12):u.password_hash;await sql.transaction([sql`UPDATE shop_users SET name=${body.name},email=${body.email},password_hash=${pwd} WHERE id=${u.id}`,...(body.password?[sql`DELETE FROM shop_sessions WHERE user_id=${u.id}`]:[])]);res.json(body.password?await session(res,{...u,...body,password_hash:pwd}):publicUser({...u,...body}));}));
app.get('/api/users',protect,admin,wrap(async(req,res)=>{const sql=db();const users=await sql`SELECT id,name,email,is_admin,created_at FROM shop_users ORDER BY created_at DESC`;res.json(users.map(publicUser));}));
app.get('/api/users/:id',protect,admin,wrap(async(req,res)=>{idSchema.parse(req.params.id);const sql=db();const [u]=await sql`SELECT id,name,email,is_admin,created_at FROM shop_users WHERE id=${req.params.id}`;if(!u)fail(404,'Kullanıcı bulunamadı.');res.json(publicUser(u));}));
app.put('/api/users/:id',protect,admin,wrap(async(req,res)=>{idSchema.parse(req.params.id);const body=z.object({name:z.string().trim().min(2).max(80),email:z.email(),isAdmin:z.boolean()}).parse(req.body);if(req.params.id===req.user._id&&!body.isAdmin)fail(400,'Kendi yönetici erişimini kaldıramazsın.');const sql=db();const [u]=await sql`UPDATE shop_users SET name=${body.name},email=${body.email.toLowerCase()},is_admin=${body.isAdmin} WHERE id=${req.params.id} RETURNING *`;if(!u)fail(404,'Kullanıcı bulunamadı.');res.json(publicUser(u));}));
app.delete('/api/users/:id',protect,admin,wrap(async(req,res)=>{idSchema.parse(req.params.id);const sql=db();const [u]=await sql`SELECT id,is_admin FROM shop_users WHERE id=${req.params.id}`;if(!u)fail(404,'Kullanıcı bulunamadı.');if(u.is_admin)fail(400,'Yönetici hesabı silinemez.');const orders=await sql`SELECT id FROM shop_orders WHERE user_id=${u.id} LIMIT 1`;if(orders.length)fail(409,'Sipariş geçmişi bulunan hesap silinemez.');await sql`DELETE FROM shop_users WHERE id=${u.id}`;res.json({message:'Kullanıcı kaldırıldı.'});}));
async function readOrder(id,user){idSchema.parse(id);const sql=db();const [o]=await sql`SELECT o.*,u.name,u.email FROM shop_orders o JOIN shop_users u ON u.id=o.user_id WHERE o.id=${id}`;if(!o)fail(404,'Sipariş bulunamadı.');if(!canReadOrder(user,{userId:o.user_id}))fail(403,'Bu siparişe erişimin yok.');return {...o.data,_id:o.id,createdAt:o.created_at,user:{_id:o.user_id,name:o.name,email:o.email}};}
app.post('/api/orders',protect,limit('checkout',20),wrap(async(req,res)=>{const body=checkoutSchema.parse(req.body);const key=idSchema.parse(req.get('Idempotency-Key'));const sql=db();const [r]=await sql`SELECT shop_checkout(${req.user._id}::uuid,${JSON.stringify(body.orderItems)}::jsonb,${JSON.stringify(body.shippingAddress)}::jsonb,${key}::uuid) AS data`;res.status(201).json(r.data);}));
app.get('/api/orders/mine',protect,wrap(async(req,res)=>{const sql=db();const rows=await sql`SELECT * FROM shop_orders WHERE user_id=${req.user._id} ORDER BY created_at DESC`;res.json(rows.map(o=>({...o.data,_id:o.id,createdAt:o.created_at})));}));
app.get('/api/orders',protect,admin,wrap(async(req,res)=>{const sql=db();const rows=await sql`SELECT o.*,u.name FROM shop_orders o JOIN shop_users u ON u.id=o.user_id ORDER BY created_at DESC`;res.json(rows.map(o=>({...o.data,_id:o.id,createdAt:o.created_at,user:{_id:o.user_id,name:o.name}})));}));
app.get('/api/orders/:id',protect,wrap(async(req,res)=>res.json(await readOrder(req.params.id,req.user))));
app.put('/api/orders/:id/pay',protect,limit('demo-payment',30),wrap(async(req,res)=>{const o=await readOrder(req.params.id,req.user);if(o.paymentMethod!=='Demo')fail(400,'Yalnızca demo siparişleri desteklenir.');const sql=db();await sql`UPDATE shop_orders SET data=data||jsonb_build_object('demoCompleted',true,'demoCompletedAt',now(),'paymentResult',jsonb_build_object('status','SIMULATED','id',id::text)) WHERE id=${o._id}`;res.json(await readOrder(o._id,req.user));}));
app.put('/api/orders/:id/deliver',protect,admin,wrap(async(req,res)=>{const o=await readOrder(req.params.id,req.user);if(!o.demoCompleted)fail(400,'Önce demo sipariş tamamlanmalı.');const sql=db();await sql`UPDATE shop_orders SET data=data||jsonb_build_object('isDelivered',true,'deliveredAt',now()) WHERE id=${o._id}`;res.json(await readOrder(o._id,req.user));}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:3*1024*1024,files:1},fileFilter:(req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
app.post('/api/upload',protect,admin,limit('upload',30),upload.single('image'),wrap(async(req,res)=>{if(!req.file)fail(400,'JPEG, PNG veya WebP görsel seç.');let image;try{image=await sharp(req.file.buffer,{limitInputPixels:20000000}).resize(1600,1600,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{fail(400,'Görsel okunamadı veya çok büyük. Geçerli bir JPEG, PNG veya WebP dosyası seç.');}const blob=await put(`products/${randomUUID()}.webp`,image,{access:'public',contentType:'image/webp'});res.json({message:'Görsel yüklendi.',image:blob.url});}));
app.use('/api',(req,res)=>res.status(404).json({message:'API endpoint bulunamadı.'}));
app.use((err,req,res,next)=>{
 if(err instanceof z.ZodError)return res.status(400).json({message:'Bilgileri kontrol et: '+err.issues.map(i=>i.path.join('.')+': '+i.message).slice(0,3).join(', ')});
 if(err.code==='23505')return res.status(409).json({message:'Bu e-posta veya yorum zaten kayıtlı.'});
 if(err.code==='23503')return res.status(409).json({message:'Bu kayıt başka verilerle ilişkili.'});
 if(err.code==='LIMIT_FILE_SIZE')return res.status(413).json({message:'Görsel en fazla 3 MB olabilir.'});
 if(/OUT_OF_STOCK|INVALID_QUANTITY|PRODUCT_NOT_FOUND/.test(err.message))return res.status(409).json({message:'Ürün veya stok bilgisi değişti. Sepetini güncelle.'});
 const status=err.status||500;if(status>=500)console.error('TechShop API error',{code:err.code||'INTERNAL',route:req.path});res.status(status).json({message:status>=500?'İşlem tamamlanamadı. Lütfen tekrar dene.':err.message});
});
export default app;
