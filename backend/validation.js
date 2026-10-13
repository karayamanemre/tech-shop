import { z } from 'zod';
export const idSchema = z.uuid();
export const credentials = z.object({ email: z.email().max(254).transform(s=>s.trim().toLowerCase()), password: z.string().min(10).max(72) });
export const registration = credentials.extend({ name: z.string().trim().min(2).max(80) });
export const addressSchema = z.object({ address: z.string().trim().min(3).max(200), city: z.string().trim().min(2).max(80), postalCode: z.string().trim().min(2).max(20), country: z.string().trim().min(2).max(80) });
export const checkoutSchema = z.object({ orderItems: z.array(z.object({ _id: idSchema, qty: z.number().int().min(1).max(20) })).min(1).max(40), shippingAddress: addressSchema, paymentMethod: z.literal('Demo') }).transform(body=>{ if (new Set(body.orderItems.map(x=>x._id)).size !== body.orderItems.length) throw Object.assign(new Error('Aynı ürün birden fazla satırda gönderilemez.'),{status:400});return body; });
export function totals(items) {const cents=items.reduce((s,x)=>s+Math.round(x.price*100)*x.qty,0);const shipping=cents>50000?0:1000;const tax=Math.round(cents*.15);return {itemsPrice:cents/100,shippingPrice:shipping/100,taxPrice:tax/100,totalPrice:(cents+shipping+tax)/100};}
export function canReadOrder(user, order) { return !!user && (user.isAdmin || user._id === order.userId); }
export function publicUser(row) { return {_id:row.id,name:row.name,email:row.email,isAdmin:row.is_admin,createdAt:row.created_at}; }
